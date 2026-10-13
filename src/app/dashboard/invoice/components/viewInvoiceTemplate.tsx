"use client";

import React, { useRef, useState } from "react";
import { Download, FileText, Printer, X } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import type {
    InvoiceResponse,
    InvoiceItem,
} from "@/app/types/invoiceType";

interface InvoiceTemplateProps {
    invoice: InvoiceResponse;
    onClose: () => void;
    mode?: "modal" | "page";
}

type CurrencyInfo = {
    currency?: string;
    symbol?: string;
};

type InvoiceDetails = Omit<InvoiceResponse, "currency"> & {
    company_details?: string;
    bill_to?: string;
    bank_account_details?: string;
    notes_payment_terms?: string;
    status?: string;
    Status?: string;
    currency?: string | CurrencyInfo;
    currency_symbol?: string;
    discount_type?: string;
    subtotal?: number | string;
    grand_total?: number | string;
    total_amount?: number | string;
    items?: InvoiceItem[];
    invoice_items?: InvoiceItem[];
    invoiceItems?: InvoiceItem[];
    details?: InvoiceItem[];
};

type ExtendedInvoiceItem = InvoiceItem & {
    id?: number | string;
    description?: string;
    item_name?: string;
    qty?: number | string;
    unit_price?: number | string;
    rate?: number | string;
    total_amount?: number | string;
    total?: number | string;
};

const numberValue = (value: unknown): number => {
    if (typeof value === "string" && !value.trim()) {
        return 0;
    }

    const number = Number(value ?? 0);

    return Number.isFinite(number) ? number : 0;
};

const textValue = (value: unknown): string => {
    return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
};

const formatDate = (date?: string | null): string => {
    if (!date) {
        return "—";
    }

    const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getDescription = (item: InvoiceItem): string => {
    const row = item as ExtendedInvoiceItem;

    return textValue(
        row.item_description ?? row.description ?? row.item_name ?? "Item",
    );
};

const getQuantity = (item: InvoiceItem): number => {
    const row = item as ExtendedInvoiceItem;

    return numberValue(item.quantity ?? row.qty);
};

const getUnitCost = (item: InvoiceItem): number => {
    const row = item as ExtendedInvoiceItem;

    return numberValue(item.unit_cost ?? row.unit_price ?? row.rate);
};

const getRowAmount = (item: InvoiceItem): number => {
    const row = item as ExtendedInvoiceItem;
    const suppliedAmount = row.total_amount ?? row.total;

    return suppliedAmount != null
        ? numberValue(suppliedAmount)
        : getUnitCost(item) * getQuantity(item);
};

export default function InvoiceTemplate({
    invoice,
    onClose,
    mode = "modal",
}: InvoiceTemplateProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const item = invoice as InvoiceDetails;

    const items =
        item.items ??
        item.invoice_items ??
        item.invoiceItems ??
        item.details ??
        [];

    const currency = item.currency;

    const currencyCode =
        typeof currency === "object" && currency
            ? currency.currency ?? ""
            : typeof currency === "string"
              ? currency
              : "";

    const currencySymbol =
        (typeof currency === "object" && currency
            ? currency.symbol
            : undefined) ??
        item.currency_symbol ??
        (/^[A-Z]{3}$/.test(currencyCode) ? "" : currencyCode);

    const formatMoney = (amount: number): string => {
        const formatted = amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        if (currencySymbol) {
            return `${currencySymbol}${formatted}`;
        }

        if (currencyCode) {
            return `${currencyCode} ${formatted}`;
        }

        return formatted;
    };

    const calculatedSubtotal = items.reduce(
        (sum, row) => sum + getRowAmount(row),
        0,
    );

    const subtotal =
        item.subtotal != null
            ? numberValue(item.subtotal)
            : calculatedSubtotal;

    const discountAmount = numberValue(item.discount_amount);
    const discountType = String(item.discount_type ?? "flat").toLowerCase();

    const discount = ["percent", "percentage", "%"].includes(discountType)
        ? (subtotal * discountAmount) / 100
        : discountAmount;

    const taxableAmount = Math.max(0, subtotal - discount);
    const taxPercentage = numberValue(item.tax_percentage);
    const tax = (taxableAmount * taxPercentage) / 100;
    const shippingFee = numberValue(item.shipping_fee);

    const calculatedTotal = taxableAmount + tax + shippingFee;

    const total =
        item.grand_total != null
            ? numberValue(item.grand_total)
            : item.total_amount != null
              ? numberValue(item.total_amount)
              : calculatedTotal;

    const status = item.status || item.Status || "Pending";

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const source = printRef.current;

        if (!source) {
            toast.error("Invoice preview is not ready.");
            return;
        }

        if (downloading) {
            return;
        }

        let clone: HTMLDivElement | null = null;

        try {
            setDownloading(true);

            clone = source.cloneNode(true) as HTMLDivElement;

            Object.assign(clone.style, {
                position: "fixed",
                left: "-10000px",
                top: "0",
                zIndex: "-1",
                width: `${source.offsetWidth}px`,
                maxWidth: "none",
                height: "auto",
                margin: "0",
                overflow: "visible",
                backgroundColor: "#ffffff",
            });

            document.body.appendChild(clone);

            const originalElements: Element[] = [
                source,
                ...Array.from(source.querySelectorAll("*")),
            ];

            const clonedElements: Element[] = [
                clone,
                ...Array.from(clone.querySelectorAll("*")),
            ];

            originalElements.forEach((original, index) => {
                const cloned = clonedElements[index];

                if (!(cloned instanceof HTMLElement)) {
                    return;
                }

                const computed = window.getComputedStyle(original);

                const colorProperties = [
                    "color",
                    "backgroundColor",
                    "borderTopColor",
                    "borderRightColor",
                    "borderBottomColor",
                    "borderLeftColor",
                    "outlineColor",
                    "textDecorationColor",
                ] as const;

                colorProperties.forEach((property) => {
                    const value = computed[property];

                    if (value) {
                        cloned.style[property] = value;
                    }
                });

                if (
                    /oklab|oklch|lab\(|lch\(|color\(/i.test(
                        computed.boxShadow,
                    )
                ) {
                    cloned.style.boxShadow = "none";
                }

                cloned.style.backdropFilter = "none";
                cloned.style.setProperty("-webkit-backdrop-filter", "none");
            });

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: clone.scrollWidth,
                height: clone.scrollHeight,
                windowWidth: Math.max(
                    document.documentElement.clientWidth,
                    clone.scrollWidth,
                ),
                onclone: (clonedDocument) => {
                    const invoiceElement =
                        clonedDocument.querySelector<HTMLElement>(
                            ".invoice-print-area",
                        );

                    if (invoiceElement) {
                        invoiceElement.style.backgroundColor = "#ffffff";
                    }
                },
            });

            const pdf = new jsPDF("p", "mm", "a4");

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const image = canvas.toDataURL("image/png");
            const imageHeight = (canvas.height * pageWidth) / canvas.width;

            let remainingHeight = imageHeight;
            let position = 0;

            pdf.addImage(image, "PNG", 0, position, pageWidth, imageHeight);

            remainingHeight -= pageHeight;

            while (remainingHeight > 0) {
                position = remainingHeight - imageHeight;

                pdf.addPage();

                pdf.addImage(
                    image,
                    "PNG",
                    0,
                    position,
                    pageWidth,
                    imageHeight,
                );

                remainingHeight -= pageHeight;
            }

            const filename = String(invoice.invoice_number || "invoice")
                .replace(/[^a-z0-9_-]/gi, "_")
                .replace(/_+/g, "_");

            pdf.save(`${filename}.pdf`);

            toast.success("Invoice PDF downloaded.");
        } catch (error) {
            console.error("PDF download failed:", error);
            toast.error("Unable to download the invoice PDF.");
        } finally {
            clone?.remove();
            setDownloading(false);
        }
    };

    return (
        <>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }

                    .invoice-print-area,
                    .invoice-print-area * {
                        visibility: visible !important;
                    }

                    .invoice-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }

                    .invoice-modal-toolbar,
                    .invoice-modal-backdrop {
                        display: none !important;
                    }

                    @page {
                        size: A4;
                        margin: 12mm;
                    }
                }
            `}</style>

            <div
                className={
                    mode === "page"
                        ? "min-h-screen bg-gray-100 p-3 sm:p-6"
                        : "invoice-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"
                }
                onClick={mode === "modal" ? onClose : undefined}
            >
                <div
                    role={mode === "modal" ? "dialog" : undefined}
                    aria-modal={mode === "modal" ? true : undefined}
                    aria-label="Invoice preview"
                    className={
                        mode === "page"
                            ? "mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
                            : "flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    }
                    onClick={
                        mode === "modal"
                            ? (event) => event.stopPropagation()
                            : undefined
                    }
                >
                    <div className="invoice-modal-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14383F]/10">
                                <FileText className="h-5 w-5 text-[#14383F]" />
                            </div>

                            <div>
                                <h2 className="font-bold text-gray-800">
                                    Invoice Preview
                                </h2>

                                <p className="text-xs text-gray-500">
                                    {invoice.invoice_number || "Invoice"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14383F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1b4b53]"
                            >
                                <Printer size={16} />
                                Print
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleDownloadPdf()}
                                disabled={downloading}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#F4C95D] px-3 py-2 text-sm font-semibold text-[#14383F] hover:bg-[#edbd4e] disabled:opacity-60"
                            >
                                {downloading ? (
                                    <ClipLoader size={14} color="#14383F" />
                                ) : (
                                    <Download size={16} />
                                )}

                                <span>
                                    {downloading
                                        ? "Generating..."
                                        : "Download PDF"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={
                                    mode === "page"
                                        ? "Back to invoices"
                                        : "Close invoice preview"
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                <X size={19} />

                                <span>
                                    {mode === "page"
                                        ? "Back to Invoices"
                                        : "Close"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        className={
                            mode === "page"
                                ? "min-h-0 flex-1 bg-gray-100 p-3 sm:p-6"
                                : "min-h-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-6"
                        }
                    >
                        <div
                            ref={printRef}
                            className="invoice-print-area mx-auto w-full max-w-4xl bg-white text-gray-800"
                        >
                            <div className="bg-[#14383F] px-6 py-8 text-white sm:px-10">
                                <div className="flex flex-col justify-between gap-6 sm:flex-row">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F4C95D]">
                                            Swornim Group
                                        </p>

                                        <h2 className="mt-3 wrap-break-word text-3xl font-bold sm:text-4xl">
                                            {invoice.invoice_number || "INVOICE"}
                                        </h2>

                                        <p className="mt-2 text-sm text-white/70">
                                            {invoice.purchase_order
                                                ? `Purchase Order: ${invoice.purchase_order}`
                                                : "Payment invoice"}
                                        </p>
                                    </div>

                                    <div className="sm:text-right">
                                        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase text-[#F4C95D]">
                                            {status}
                                        </span>

                                        <p className="mt-4 text-sm text-white/70">
                                            Invoice Date
                                        </p>

                                        <p className="font-semibold">
                                            {formatDate(invoice.invoice_date)}
                                        </p>

                                        <p className="mt-3 text-sm text-white/70">
                                            Due Date
                                        </p>

                                        <p className="font-semibold">
                                            {formatDate(invoice.due_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
                                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                    <div>
                                        <h3 className="mb-3 border-l-4 border-[#F4C95D] pl-3 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            From
                                        </h3>

                                        <div className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                            {item.company_details || "Company details"}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-3 border-l-4 border-[#F4C95D] pl-3 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            Bill To
                                        </h3>

                                        <div className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                            {item.bill_to || "Customer details"}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#14383F]">
                                        Invoice Items
                                    </h3>

                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="bg-[#14383F] text-white">
                                                    <th className="px-4 py-3">
                                                        Description
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Unit Cost
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {items.length > 0 ? (
                                                    items.map((row, index) => (
                                                        <tr
                                                            key={
                                                                (row as ExtendedInvoiceItem).id ??
                                                                index
                                                            }
                                                            className={
                                                                index % 2
                                                                    ? "bg-gray-50"
                                                                    : "bg-white"
                                                            }
                                                        >
                                                            <td className="border-b border-gray-100 px-4 py-4 font-medium">
                                                                {getDescription(row)}
                                                            </td>

                                                            <td className="whitespace-nowrap border-b border-gray-100 px-4 py-4 text-right">
                                                                {formatMoney(getUnitCost(row))}
                                                            </td>

                                                            <td className="border-b border-gray-100 px-4 py-4 text-center">
                                                                {getQuantity(row)}
                                                            </td>

                                                            <td className="whitespace-nowrap border-b border-gray-100 px-4 py-4 text-right font-semibold">
                                                                {formatMoney(getRowAmount(row))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="px-4 py-10 text-center text-gray-400"
                                                        >
                                                            No invoice items found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <div className="w-full max-w-sm space-y-3 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500">
                                                Subtotal
                                            </span>
                                            <span className="font-semibold">
                                                {formatMoney(subtotal)}
                                            </span>
                                        </div>

                                        {discount !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    Discount
                                                </span>
                                                <span className="font-semibold text-green-700">
                                                    −{formatMoney(discount)}
                                                </span>
                                            </div>
                                        )}

                                        {taxPercentage !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    Tax ({taxPercentage}%)
                                                </span>
                                                <span className="font-semibold">
                                                    {formatMoney(tax)}
                                                </span>
                                            </div>
                                        )}

                                        {shippingFee !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    Shipping Fee
                                                </span>
                                                <span className="font-semibold">
                                                    {formatMoney(shippingFee)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="border-t-2 border-[#14383F] pt-4">
                                            <div className="flex justify-between gap-4">
                                                <span className="font-bold uppercase text-[#14383F]">
                                                    Grand Total
                                                </span>
                                                <span className="text-xl font-bold text-[#14383F]">
                                                    {formatMoney(total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                                    <div>
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            Payment Terms
                                        </h3>

                                        <p className="whitespace-pre-line text-sm leading-6 text-gray-500">
                                            {item.notes_payment_terms ||
                                                "Please make payment by the due date."}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            Bank Account Details
                                        </h3>

                                        <p className="whitespace-pre-line text-sm leading-6 text-gray-500">
                                            {item.bank_account_details ||
                                                "Please contact us for payment details."}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-5 text-center">
                                    <p className="text-sm font-semibold text-[#14383F]">
                                        Thank you for your business!
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Please contact us if you have any
                                        questions regarding this invoice.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}