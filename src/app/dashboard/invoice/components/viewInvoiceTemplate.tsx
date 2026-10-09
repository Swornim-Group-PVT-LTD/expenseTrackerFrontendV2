
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
    Printer,
    Download,
    Building2,
    CalendarDays,
    FileText,
    CreditCard,
    Landmark,
    CheckCircle2,
    Clock3,
    Hash,
    RefreshCw,
    X,
} from "lucide-react";
import { ClipLoader } from "react-spinners";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getInvoiceBySn } from "../../../services/invoiceService";

export interface InvoiceItem {
    id?: number | string;
    description?: string;
    item_name?: string;
    name?: string;
    quantity?: number | string;
    qty?: number | string;
    rate?: number | string;
    unit_price?: number | string;
    price?: number | string;
    amount?: number | string;
    total?: number | string;
}

export interface InvoiceData {
    sn?: string | number;
    invoice_number?: string;
    purchase_order?: string;
    company_details?: string;
    bill_to?: string;
    invoice_date?: string;
    due_date?: string;
    notes_payment_terms?: string;
    bank_account_details?: string;
    tax_percentage?: number | string;
    discount_amount?: number | string;
    discount_type?: string;
    shipping_fee?: number | string;
    status?: string;
    Status?: string;
    currency_symbol?: string;
    currency?: string;
    subtotal?: number | string;
    total_amount?: number | string;
    grand_total?: number | string;
    items?: InvoiceItem[];
    invoice_items?: InvoiceItem[];
    [key: string]: unknown;
}

interface InvoiceTemplateProps {
    sn?: string | number;
    invoice?: InvoiceData;
    items?: InvoiceItem[];
    currencySymbol?: string;
    onClose?: () => void;
}

const TEAL = "#14383F";
const GOLD = "#F4C95D";
const CREAM = "#FFFAE8";

const toNumber = (value: unknown): number => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (amount: number, symbol: string): string =>
    `${symbol} ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (date?: string): string => {
    if (!date) return "—";

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const parsed = new Date(dateOnly ? `${date}T12:00:00` : date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatLines = (value?: string): string[] =>
    (value || "").split(/\r?\n/).filter((line) => line.trim());

/**
 * Supports common Laravel response shapes:
 * { data: { ...invoice } }
 * { invoice: { ...invoice } }
 * { data: { invoice: { ...invoice } } }
 * { ...invoice }
 */
function normalizeInvoiceResponse(response: unknown): InvoiceData {
    let result = response as Record<string, unknown>;

    if (result?.data && typeof result.data === "object") {
        result = result.data as Record<string, unknown>;
    }

    if (result?.invoice && typeof result.invoice === "object") {
        result = result.invoice as Record<string, unknown>;
    }

    if (result?.data && typeof result.data === "object") {
        result = result.data as Record<string, unknown>;
    }

    const rawItems =
        result.items ??
        result.invoice_items ??
        result.invoiceItems ??
        result.details;

    return {
        ...result,
        items: Array.isArray(rawItems)
            ? (rawItems as InvoiceItem[])
            : [],
    } as InvoiceData;
}

export default function InvoiceTemplate({
    sn,
    invoice: initialInvoice,
    items: suppliedItems,
    currencySymbol,
    onClose,
}: InvoiceTemplateProps) {
    const params = useParams<{ sn?: string | string[] }>();
    const routeValue = params?.sn;
    const routeSn = Array.isArray(routeValue)
        ? routeValue[0]
        : routeValue;

    const invoiceSn = sn ?? routeSn;

    const [invoice, setInvoice] = useState<InvoiceData | null>(
        initialInvoice ?? null
    );
    const [loading, setLoading] = useState(!initialInvoice);
    const [error, setError] = useState("");
    const [pdfLoading, setPdfLoading] = useState(false);

    const invoiceRef = useRef<HTMLElement>(null);

    const loadInvoice = useCallback(async () => {
        if (invoiceSn === undefined || invoiceSn === null || String(invoiceSn).trim() === "") {
            if (!initialInvoice) {
                setError("Invoice reference (sn) was not provided.");
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getInvoiceBySn(invoiceSn);
            const fetchedInvoice = normalizeInvoiceResponse(response);

            if (
                fetchedInvoice.sn === undefined &&
                !fetchedInvoice.invoice_number &&
                !fetchedInvoice.items?.length
            ) {
                throw new Error("The API returned no invoice details.");
            }

            setInvoice(fetchedInvoice);
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to fetch invoice details.";

            setError(message);
        } finally {
            setLoading(false);
        }
    }, [invoiceSn, initialInvoice]);

    useEffect(() => {
        if (initialInvoice && invoiceSn === undefined) {
            setInvoice(initialInvoice);
            setLoading(false);
            return;
        }

        void loadInvoice();
    }, [loadInvoice, initialInvoice, invoiceSn]);

    const invoiceItems = useMemo(
        () => suppliedItems ?? invoice?.items ?? invoice?.invoice_items ?? [],
        [suppliedItems, invoice]
    );

    const symbol =
        currencySymbol ||
        invoice?.currency_symbol ||
        invoice?.currency ||
        "Rs.";

    const subtotal = useMemo(
        () =>
            invoiceItems.reduce((sum, item) => {
                const quantity = toNumber(item.quantity ?? item.qty ?? 1);
                const rate = toNumber(
                    item.rate ??
                        item.unit_price ??
                        item.price ??
                        item.amount
                );

                const amount =
                    item.total !== undefined && item.total !== null
                        ? toNumber(item.total)
                        : rate * quantity;

                return sum + amount;
            }, 0),
        [invoiceItems]
    );

    const discountValue = Math.max(
        0,
        toNumber(invoice?.discount_amount)
    );

    const normalizedDiscountType = String(
        invoice?.discount_type ?? "fixed"
    ).toLowerCase();

    const isPercentageDiscount = [
        "percentage",
        "percent",
        "%",
    ].includes(normalizedDiscountType);

    const discount = isPercentageDiscount
        ? (subtotal * Math.min(discountValue, 100)) / 100
        : discountValue;

    const discountTotal = Math.min(discount, subtotal);
    const taxableAmount = Math.max(0, subtotal - discountTotal);

    const taxPercentage = Math.max(
        0,
        toNumber(invoice?.tax_percentage)
    );

    const taxAmount = (taxableAmount * taxPercentage) / 100;
    const shippingFee = Math.max(0, toNumber(invoice?.shipping_fee));

    // Use the same calculation for the displayed summary and PDF.
    const calculatedTotal = taxableAmount + taxAmount + shippingFee;

    const grandTotal =
        invoice?.grand_total !== undefined &&
        invoice?.grand_total !== null &&
        invoice.grand_total !== ""
            ? toNumber(invoice.grand_total)
            : invoice?.total_amount !== undefined &&
                invoice?.total_amount !== null &&
                invoice.total_amount !== ""
              ? toNumber(invoice.total_amount)
              : calculatedTotal;

    const status = String(
        invoice?.status ?? invoice?.Status ?? "Pending"
    );

    const normalizedStatus = status.toLowerCase();

    const isPaid = ["paid", "completed", "complete"].includes(
        normalizedStatus
    );

    const isCancelled = [
        "cancelled",
        "canceled",
        "void",
    ].includes(normalizedStatus);

    const statusStyle = isPaid
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : isCancelled
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-800 border-amber-200";

    const companyLines = formatLines(invoice?.company_details);
    const customerLines = formatLines(invoice?.bill_to);
    const paymentLines = formatLines(invoice?.bank_account_details);
    const termsLines = formatLines(invoice?.notes_payment_terms);

    const safeFileName = String(
        invoice?.invoice_number || invoice?.sn || "invoice"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current || pdfLoading) return;

        setPdfLoading(true);

        try {
            // Render the actual invoice at a high resolution.
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                windowWidth: Math.max(
                    document.documentElement.clientWidth,
                    1024
                ),
                onclone: (clonedDocument) => {
                    const clonedInvoice =
                        clonedDocument.querySelector<HTMLElement>(
                            ".invoice-print-area"
                        );

                    if (clonedInvoice) {
                        clonedInvoice.style.width = "794px";
                        clonedInvoice.style.maxWidth = "none";
                        clonedInvoice.style.margin = "0";
                        clonedInvoice.style.borderRadius = "0";
                        clonedInvoice.style.boxShadow = "none";
                        clonedInvoice.style.overflow = "visible";

                        // Keep the document readable on a PDF page.
                        clonedInvoice.querySelectorAll<HTMLElement>(
                            ".invoice-content"
                        ).forEach((element) => {
                            element.style.paddingLeft = "32px";
                            element.style.paddingRight = "32px";
                        });
                    }
                },
            });

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const contentWidth = pageWidth - margin * 2;
            const contentHeight = pageHeight - margin * 2;

            const imageHeight =
                (canvas.height * contentWidth) / canvas.width;

            if (imageHeight <= contentHeight) {
                pdf.addImage(
                    canvas.toDataURL("image/jpeg", 0.95),
                    "JPEG",
                    margin,
                    margin,
                    contentWidth,
                    imageHeight,
                    undefined,
                    "FAST"
                );
            } else {
                // Split a long invoice into A4 pages without
                // stretching or cutting off the bottom of the invoice.
                const pageCanvas = document.createElement("canvas");
                const pageContext = pageCanvas.getContext("2d");

                if (!pageContext) {
                    throw new Error("Could not prepare the PDF document.");
                }

                const sourcePageHeight = Math.floor(
                    (canvas.width * contentHeight) / contentWidth
                );

                pageCanvas.width = canvas.width;
                pageCanvas.height = sourcePageHeight;

                let sourceY = 0;
                let pageNumber = 0;

                while (sourceY < canvas.height) {
                    const sliceHeight = Math.min(
                        sourcePageHeight,
                        canvas.height - sourceY
                    );

                    pageContext.fillStyle = "#ffffff";
                    pageContext.fillRect(
                        0,
                        0,
                        pageCanvas.width,
                        pageCanvas.height
                    );

                    pageContext.drawImage(
                        canvas,
                        0,
                        sourceY,
                        canvas.width,
                        sliceHeight,
                        0,
                        0,
                        canvas.width,
                        sliceHeight
                    );

                    if (pageNumber > 0) pdf.addPage();

                    const actualHeight =
                        (sliceHeight * contentWidth) / canvas.width;

                    pdf.addImage(
                        pageCanvas.toDataURL("image/jpeg", 0.95),
                        "JPEG",
                        margin,
                        margin,
                        contentWidth,
                        actualHeight,
                        undefined,
                        "FAST"
                    );

                    sourceY += sliceHeight;
                    pageNumber++;
                }
            }

            pdf.save(`${safeFileName}.pdf`);
        } catch (err) {
            console.error("Invoice PDF generation failed:", err);
            window.alert(
                "Could not generate the PDF. Please try Print / Save PDF instead."
            );
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <ClipLoader color={TEAL} size={42} />
                <p className="text-sm font-medium text-slate-500">
                    Loading invoice details...
                </p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
                <div className="mb-4 rounded-full bg-red-50 p-4 text-red-600">
                    <FileText size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                    Unable to load invoice
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                    {error || "The requested invoice could not be found."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => void loadInvoice()}
                        className="flex items-center gap-2 rounded-lg bg-[#14383F] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                        >
                            <X size={16} />
                            Close
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="invoice-template min-h-screen bg-slate-100 px-3 py-6 sm:px-6">
            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }

                @media print {
                    html,
                    body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .invoice-print-area,
                    .invoice-print-area * {
                        visibility: visible !important;
                    }

                    .invoice-template {
                        min-height: 0 !important;
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    .invoice-print-area {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .invoice-print-area table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .invoice-print-area thead {
                        display: table-header-group;
                    }

                    .invoice-print-area tfoot {
                        display: table-footer-group;
                    }

                    .invoice-print-area tr {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    .invoice-print-area th,
                    .invoice-print-area td {
                        overflow-wrap: anywhere;
                    }

                    .print-header {
                        background: ${TEAL} !important;
                        color: #ffffff !important;
                    }

                    .print-gold {
                        background: ${GOLD} !important;
                        color: ${TEAL} !important;
                    }

                    .print-cream {
                        background: ${CREAM} !important;
                    }

                    .invoice-content {
                        padding-top: 20px !important;
                        padding-bottom: 20px !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* Toolbar: never included in print or the PDF */}
            <div className="no-print mx-auto mb-5 flex max-w-[900px] flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[#14383F] sm:text-2xl">
                        Invoice Preview
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Invoice {invoice.invoice_number || invoice.sn}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <X size={16} />
                            Close
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-lg bg-[#14383F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#20515A]"
                    >
                        <Printer size={17} />
                        Print
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={pdfLoading}
                        className="flex items-center gap-2 rounded-lg bg-[#F4C95D] px-4 py-2.5 text-sm font-bold text-[#14383F] shadow-sm hover:bg-[#e8bc49] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {pdfLoading ? (
                            <ClipLoader color={TEAL} size={16} />
                        ) : (
                            <Download size={17} />
                        )}
                        {pdfLoading ? "Generating..." : "Download PDF"}
                    </button>
                </div>
            </div>

            {/* Only this section is printed and exported */}
            <article
                ref={invoiceRef}
                className="invoice-print-area mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            >
                <header className="print-header relative overflow-hidden bg-[#14383F] px-6 py-8 text-white sm:px-10 sm:py-10">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border-[24px] border-white/5" />
                    <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-white/5" />

                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="print-gold flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F4C95D] text-[#14383F] shadow-md">
                                <Building2 size={30} strokeWidth={2.2} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-xl font-extrabold tracking-wide sm:text-2xl">
                                    {companyLines[0] || "SWORNIM GROUP"}
                                </h2>
                                <p className="mt-1 text-sm font-medium tracking-[0.18em] text-[#F4C95D]">
                                    PRIVATE LIMITED
                                </p>
                                {companyLines.slice(1).map((line, index) => (
                                    <p
                                        key={index}
                                        className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/80"
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="sm:text-right">
                            <h1 className="text-4xl font-black tracking-wider sm:text-5xl">
                                INVOICE
                            </h1>
                            <div className="print-gold mt-3 inline-flex items-center gap-2 rounded-full bg-[#F4C95D] px-3 py-1.5 text-sm font-bold text-[#14383F]">
                                <Hash size={15} />
                                {invoice.invoice_number || "DRAFT"}
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-7 h-1 rounded-full bg-white/15">
                        <div className="h-1 w-1/3 rounded-full bg-[#F4C95D]" />
                    </div>
                </header>

                <div className="invoice-content space-y-7 px-6 py-7 sm:px-10 sm:py-9">
                    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Invoice Reference
                            </p>
                            <h3 className="mt-2 break-words text-xl font-bold text-[#14383F]">
                                {invoice.invoice_number || "Draft Invoice"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Purchase Order:{" "}
                                <span className="font-semibold text-slate-700">
                                    {invoice.purchase_order || "N/A"}
                                </span>
                            </p>
                            {invoice.sn !== undefined && (
                                <p className="mt-1 text-xs text-slate-400">
                                    Reference SN: {invoice.sn}
                                </p>
                            )}
                        </div>

                        <span
                            className={`inline-flex h-fit items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle}`}
                        >
                            {isPaid ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <Clock3 size={14} />
                            )}
                            {status}
                        </span>
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14383F] text-[#F4C95D]">
                                    <CalendarDays size={18} />
                                </span>
                                <h3 className="font-bold text-[#14383F]">
                                    Invoice Dates
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-slate-500">
                                        Issue Date
                                    </span>
                                    <span className="text-right text-sm font-semibold text-slate-800">
                                        {formatDate(invoice.invoice_date)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-slate-500">
                                        Due Date
                                    </span>
                                    <span className="text-right text-sm font-semibold text-slate-800">
                                        {formatDate(invoice.due_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="print-cream rounded-xl border border-[#E9D99D] bg-[#FFFAE8] p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="print-gold flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4C95D] text-[#14383F]">
                                    <CreditCard size={18} />
                                </span>
                                <h3 className="font-bold text-[#14383F]">
                                    Payment Summary
                                </h3>
                            </div>
                            <p className="text-sm text-slate-500">
                                Total Amount Due
                            </p>
                            <p className="mt-1 break-words text-2xl font-extrabold text-[#14383F] sm:text-3xl">
                                {formatMoney(grandTotal, symbol)}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Currency: {symbol}
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <div className="h-5 w-1 rounded-full bg-[#F4C95D]" />
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#14383F]">
                                    From
                                </h3>
                            </div>
                            <div className="space-y-1 pl-3">
                                <p className="font-bold text-slate-800">
                                    {companyLines[0] || "Swornim Group Pvt. Ltd."}
                                </p>
                                {companyLines.slice(1).map((line, index) => (
                                    <p
                                        key={index}
                                        className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-500"
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <div className="h-5 w-1 rounded-full bg-[#F4C95D]" />
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#14383F]">
                                    Bill To
                                </h3>
                            </div>
                            <div className="space-y-1 pl-3">
                                {customerLines.length ? (
                                    customerLines.map((line, index) => (
                                        <p
                                            key={index}
                                            className={`whitespace-pre-wrap break-words leading-6 ${
                                                index === 0
                                                    ? "font-bold text-slate-800"
                                                    : "text-sm text-slate-500"
                                            }`}
                                        >
                                            {line}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">
                                        Customer details not provided.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-[#14383F]" />
                            <h3 className="text-base font-extrabold text-[#14383F]">
                                Invoice Details
                            </h3>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[520px] table-fixed text-left">
                                <thead>
                                    <tr className="print-header bg-[#14383F] text-white">
                                        <th className="w-[9%] px-3 py-4 text-center text-xs font-bold uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="w-[15%] px-3 py-4 text-right text-xs font-bold uppercase tracking-wider">
                                            Qty
                                        </th>
                                        <th className="w-[22%] px-3 py-4 text-right text-xs font-bold uppercase tracking-wider">
                                            Rate
                                        </th>
                                        <th className="w-[25%] px-3 py-4 text-right text-xs font-bold uppercase tracking-wider">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceItems.length ? (
                                        invoiceItems.map((item, index) => {
                                            const quantity = toNumber(
                                                item.quantity ?? item.qty ?? 1
                                            );
                                            const rate = toNumber(
                                                item.rate ??
                                                    item.unit_price ??
                                                    item.price ??
                                                    item.amount
                                            );
                                            const amount =
                                                item.total !== undefined &&
                                                item.total !== null
                                                    ? toNumber(item.total)
                                                    : rate * quantity;

                                            return (
                                                <tr
                                                    key={item.id ?? index}
                                                    className={
                                                        index % 2 === 0
                                                            ? "bg-white"
                                                            : "bg-slate-50/70"
                                                    }
                                                >
                                                    <td className="border-b border-slate-100 px-3 py-4 text-center text-sm text-slate-400">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </td>
                                                    <td className="break-words border-b border-slate-100 px-3 py-4 text-sm font-semibold text-slate-700">
                                                        {item.description ||
                                                            item.item_name ||
                                                            item.name ||
                                                            "Service"}
                                                    </td>
                                                    <td className="border-b border-slate-100 px-3 py-4 text-right text-sm text-slate-600">
                                                        {quantity.toLocaleString()}
                                                    </td>
                                                    <td className="border-b border-slate-100 px-3 py-4 text-right text-sm text-slate-600">
                                                        {formatMoney(rate, symbol)}
                                                    </td>
                                                    <td className="border-b border-slate-100 px-3 py-4 text-right text-sm font-bold text-[#14383F]">
                                                        {formatMoney(amount, symbol)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-sm text-slate-400"
                                            >
                                                No invoice line items were returned by the API.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="flex justify-end">
                        <div className="w-full space-y-3 sm:max-w-[360px]">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-500">
                                    Subtotal
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {formatMoney(subtotal, symbol)}
                                </span>
                            </div>

                            {discountValue > 0 && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-500">
                                        Discount
                                        {isPercentageDiscount
                                            ? ` (${discountValue}%)`
                                            : ""}
                                    </span>
                                    <span className="text-sm font-semibold text-emerald-700">
                                        -{formatMoney(discountTotal, symbol)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-500">
                                    Tax ({taxPercentage}%)
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {formatMoney(taxAmount, symbol)}
                                </span>
                            </div>

                            {shippingFee > 0 && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-500">
                                        Shipping Fee
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {formatMoney(shippingFee, symbol)}
                                    </span>
                                </div>
                            )}

                            <div className="print-cream rounded-xl border border-[#E9D99D] bg-[#FFFAE8] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#806414]">
                                            Grand Total
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Inclusive of applicable tax
                                        </p>
                                    </div>
                                    <p className="break-words text-right text-xl font-black text-[#14383F] sm:text-2xl">
                                        {formatMoney(grandTotal, symbol)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {(termsLines.length > 0 || paymentLines.length > 0) && (
                        <section className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                            {termsLines.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <FileText size={18} className="text-[#14383F]" />
                                        <h3 className="font-bold text-[#14383F]">
                                            Notes &amp; Payment Terms
                                        </h3>
                                    </div>
                                    <div className="space-y-1">
                                        {termsLines.map((line, index) => (
                                            <p
                                                key={index}
                                                className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-500"
                                            >
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {paymentLines.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <Landmark size={18} className="text-[#14383F]" />
                                        <h3 className="font-bold text-[#14383F]">
                                            Bank Account Details
                                        </h3>
                                    </div>
                                    <div className="space-y-1">
                                        {paymentLines.map((line, index) => (
                                            <p
                                                key={index}
                                                className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-500"
                                            >
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    <footer className="print-header relative overflow-hidden rounded-xl bg-[#14383F] px-5 py-6 text-center text-white">
                        <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[#F4C95D]" />
                        <p className="text-base font-bold text-[#F4C95D]">
                            Thank you for your business!
                        </p>
                        <p className="mt-2 text-xs leading-5 text-white/75">
                            If you have any questions about this invoice,
                            please contact the issuer.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-white/90">
                            <span className="h-px w-8 bg-[#F4C95D]" />
                            SWORNIM GROUP PVT. LTD.
                            <span className="h-px w-8 bg-[#F4C95D]" />
                        </div>
                    </footer>
                </div>
            </article>

            <div className="no-print mx-auto mt-4 max-w-[900px] text-center text-xs text-slate-400">
                <Download size={13} className="mr-1 inline-block" />
                Download PDF saves an A4 PDF directly. Print opens your
                browser&apos;s print dialog.
            </div>
        </div>
    );
}