"use client";

import { useTranslation } from "react-i18next";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Printer, X } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { calculateInvoiceTotals } from "@/app/utils/invoiceTotals";
import AccountLogo from "@/app/components/AccountLogo";
import { useAuth } from "@/context/AuthContext";

import type {
    InvoiceResponse,
    InvoiceItem,
} from "@/app/types/invoiceType";

interface InvoiceTemplateProps {
    invoice: InvoiceResponse;
    onClose: () => void;
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

const formatDate = (date: string | null | undefined, locale: string): string => {
    if (!date) {
        return "—";
    }

    const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(locale, {
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
}: InvoiceTemplateProps) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "np" ? "ne-NP" : "en-GB";
    const { user } = useAuth();
    const printRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const item = invoice as InvoiceDetails;
    const issuerName =
        item.company_details?.trim().split(/\r?\n/, 1)[0]?.trim() ||
        [user?.first_name, user?.middle_name, user?.last_name]
            .map((name) => name?.trim())
            .filter(Boolean)
            .join(" ");

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

    const taxPercentage = numberValue(item.tax_percentage);
    const shippingFee = numberValue(item.shipping_fee);
    const { discount, tax, total: calculatedTotal } = calculateInvoiceTotals(
        subtotal,
        numberValue(item.discount_amount),
        invoice.discount_type ?? null,
        taxPercentage,
        shippingFee,
    );
    const total = item.grand_total ?? item.total_amount ?? calculatedTotal;

    const status = item.status || item.Status || "Pending";

    const handlePrint = async () => {
        const logo = printRef.current?.querySelector("img");
        await Promise.allSettled([document.fonts.ready, logo?.decode()]);
        window.print();
    };

    const handleDownloadPdf = async () => {
        const source = printRef.current;

        if (!source) {
            toast.error(t("Invoice preview is not ready."));
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

            toast.success(t("Invoice PDF downloaded."));
        } catch (error) {
            console.error("PDF download failed:", error);
            toast.error(t("Unable to download the invoice PDF."));
        } finally {
            clone?.remove();
            setDownloading(false);
        }
    };

    return createPortal(
        <div
            className="invoice-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 12mm;
                }

                @media print {
                    body:has(> .invoice-overlay) > :not(.invoice-overlay) {
                        display: none !important;
                    }

                    html, body {
                        margin: 0 !important;
                        background: white !important;
                    }

                    .invoice-overlay,
                    .invoice-modal-shell,
                    .invoice-modal-content {
                        position: static !important;
                        display: block !important;
                        width: auto !important;
                        max-width: none !important;
                        max-height: none !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        box-shadow: none !important;
                    }

                    .invoice-modal-toolbar {
                        display: none !important;
                    }

                    .invoice-print-area {
                        max-width: none !important;
                        color: #17252b;
                        font: 11pt/1.4 Arial, var(--font-nepali), Helvetica, sans-serif;
                    }

                    .invoice-print-header {
                        break-inside: avoid;
                        background: white !important;
                        border-bottom: 1px solid #14383f;
                        padding: 0 0 5mm !important;
                    }

                    .invoice-print-header * {
                        color: #14383f !important;
                    }

                    .invoice-print-header img {
                        width: auto;
                        height: 13mm;
                        max-width: 50mm;
                        margin-bottom: 2mm;
                    }

                    .invoice-print-header h2 {
                        margin-top: 2mm;
                        font-size: 20pt;
                        line-height: 1.2;
                    }

                    .invoice-print-body {
                        padding: 5mm 0 0 !important;
                    }

                    .invoice-print-body > * + * {
                        margin-top: 5mm;
                    }

                    .invoice-print-area p,
                    .invoice-print-area td,
                    .invoice-print-area th,
                    .invoice-print-area .invoice-address {
                        font-size: 10pt;
                        line-height: 1.4;
                    }

                    .invoice-print-area th,
                    .invoice-print-area td {
                        padding: 2mm 3mm;
                    }

                    .invoice-print-area thead {
                        display: table-header-group;
                    }

                    .invoice-print-area tr,
                    .invoice-print-keep-together {
                        break-inside: avoid;
                    }

                    .invoice-print-table {
                        overflow: visible !important;
                    }
                }
            `}</style>

            <div
                role="dialog"
                aria-modal="true"
                aria-label={t("Invoice preview")}
                className="invoice-modal-shell flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                    <div className="invoice-modal-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14383F]/10">
                                <FileText className="h-5 w-5 text-[#14383F]" />
                            </div>

                            <div>
                                <h2 className="font-bold text-gray-800">
                                    {t("Invoice Preview")}
                                </h2>

                                <p className="text-xs text-gray-500">
                                    {invoice.invoice_number || t("Invoice")}
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
                                {t("Print")}
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
                                        ? t("Generating...")
                                        : t("Download PDF")}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={t("Close invoice preview")}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#082c28] hover:bg-teal-50"
                            >
                                <X size={19} />

                                <span>
                                    {t("Close")}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        className="invoice-modal-content min-h-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-6"
                    >
                        <div
                            ref={printRef}
                            className="invoice-print-area mx-auto w-full max-w-4xl bg-white text-gray-800"
                        >
                            <div className="invoice-print-header bg-[#14383F] px-6 py-8 text-white sm:px-10">
                                <div className="flex flex-col justify-between gap-6 sm:flex-row print:flex-row">
                                    <div>
                                        <AccountLogo
                                            alt={t("Account logo")}
                                            className="mb-4 h-14 max-w-40 object-contain object-left"
                                        />
                                        {issuerName && (
                                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F4C95D]">
                                                {issuerName}
                                            </p>
                                        )}

                                        <h2 className="mt-3 wrap-break-word text-3xl font-bold sm:text-4xl">
                                            {invoice.invoice_number || t("Invoice")}
                                        </h2>

                                        <p className="mt-2 text-sm text-white/70">
                                            {invoice.purchase_order
                                                ? t("Purchase Order: {{number}}", { number: invoice.purchase_order })
                                                : t("Payment invoice")}
                                        </p>
                                    </div>

                                    <div className="sm:text-right print:text-right">
                                        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase text-[#F4C95D]">
                                            {t(status)}
                                        </span>

                                        <p className="mt-4 text-sm text-white/70">
                                            {t("Invoice Date")}
                                        </p>

                                        <p className="font-semibold">
                                            {formatDate(invoice.invoice_date, dateLocale)}
                                        </p>

                                        <p className="mt-3 text-sm text-white/70">
                                            {t("Due Date")}
                                        </p>

                                        <p className="font-semibold">
                                            {formatDate(invoice.due_date, dateLocale)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-print-body space-y-8 px-6 py-8 sm:px-10 sm:py-10 print:space-y-0">
                                <div className="invoice-print-keep-together grid grid-cols-1 gap-8 sm:grid-cols-2 print:grid-cols-2 print:gap-5">
                                    <div>
                                        <h3 className="mb-3 border-l-4 border-[#F4C95D] pl-3 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            {t("From")}
                                        </h3>

                                        <div className="invoice-address whitespace-pre-line text-sm leading-7 text-gray-600">
                                            {item.company_details || t("Company Details")}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-3 border-l-4 border-[#F4C95D] pl-3 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            {t("Bill To")}
                                        </h3>

                                        <div className="invoice-address whitespace-pre-line text-sm leading-7 text-gray-600">
                                            {item.bill_to || t("Customer details")}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#14383F]">
                                        {t("Invoice Items")}
                                    </h3>

                                    <div className="invoice-print-table overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="ledger-table w-full border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-[#082c28]">
                                                    <th className="px-4 py-3">
                                                        {t("Description")}
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        {t("Unit Cost")}
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        {t("Qty")}
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        {t("Amount")}
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
                                                            {t("No invoice items found.")}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="invoice-print-keep-together flex justify-end">
                                    <div className="w-full max-w-sm space-y-3 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500">
                                                {t("Subtotal")}
                                            </span>
                                            <span className="font-semibold">
                                                {formatMoney(subtotal)}
                                            </span>
                                        </div>

                                        {discount !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    {t("Discount")}{invoice.discount_type === "percent" ? ` (${numberValue(invoice.discount_amount)}%)` : ""}
                                                </span>
                                                <span className="font-semibold text-green-700">
                                                    −{formatMoney(discount)}
                                                </span>
                                            </div>
                                        )}

                                        {taxPercentage !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    {t("Tax (")}{taxPercentage}%)
                                                </span>
                                                <span className="font-semibold">
                                                    {formatMoney(tax)}
                                                </span>
                                            </div>
                                        )}

                                        {shippingFee !== 0 && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500">
                                                    {t("Shipping Fee")}
                                                </span>
                                                <span className="font-semibold">
                                                    {formatMoney(shippingFee)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="border-t-2 border-[#14383F] pt-4">
                                            <div className="flex justify-between gap-4">
                                                <span className="font-bold uppercase text-[#14383F]">
                                                    {t("Grand Total")}
                                                </span>
                                                <span className="text-xl font-bold text-[#14383F]">
                                                    {formatMoney(numberValue(total))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="invoice-print-keep-together grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2 print:grid-cols-2 print:gap-5 print:pt-4">
                                    <div>
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            {t("Payment Terms")}
                                        </h3>

                                        <p className="whitespace-pre-line text-sm leading-6 text-gray-500">
                                            {item.notes_payment_terms ||
                                                t("Please make payment by the due date.")}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14383F]">
                                            {t("Bank Account Details")}
                                        </h3>

                                        <p className="whitespace-pre-line text-sm leading-6 text-gray-500">
                                            {item.bank_account_details ||
                                                t("Please contact us for payment details.")}
                                        </p>
                                    </div>
                                </div>

                                <div className="invoice-print-keep-together border-t border-gray-200 pt-5 text-center print:pt-3">
                                    <p className="text-sm font-semibold text-[#14383F]">
                                        {t("Thank you for your business!")}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {t("Please contact us if you have any questions regarding this invoice.")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>,
        document.body,
    );
}