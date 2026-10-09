"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
} from "flowbite-react";
import { ClipLoader } from "react-spinners";
import {
    Eye,
    Pencil,
    Trash2,
    X,
    Save,
    FileText,
    Printer,
    Download,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    getInvoiceService,
    getInvoiceBySnService,
    updateInvoiceService,
} from "@/app/services/invoiceService";

import type { InvoiceResponse } from "@/app/types/invoiceType";

interface InvoiceTableProps {
    filteredData?: InvoiceResponse[];
    isFilterActive?: boolean;
    onDataChange?: () => void;
    refreshTrigger?: number;
    onSuccess?: () => void;
    onDataLoad?: (data: InvoiceResponse[]) => void;

    onViewInvoice: (invoice: InvoiceResponse) => void;
}

type InvoiceItem = {
    item_description?: string;
    unit_cost?: number | string;
    quantity?: number | string;
    amount?: number | string;
    total?: number | string;
};

type ExtendedInvoice = InvoiceResponse & {
    status?: string;
    Status?: string;
    company_details?: string;
    bill_to?: string;
    bank_account_details?: string;
    notes_payment_terms?: string;
    tax_percentage?: number | string;
    discount_amount?: number | string;
    discount_type?: string;
    shipping_fee?: number | string;
    subtotal?: number | string;
    total_amount?: number | string;
    grand_total?: number | string;
    items?: InvoiceItem[];
    currency?: {
        currency?: string;
        symbol?: string;
    };
};

const numberValue = (value: unknown): number => {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
};

export default function InvoiceTable({
    filteredData,
    isFilterActive = false,
    onDataChange,
    refreshTrigger,
    onSuccess,
    onDataLoad,
}: InvoiceTableProps) {
    const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
    const [editingSn, setEditingSn] = useState<string | null>(null);
    const [viewInvoice, setViewInvoice] =
        useState<InvoiceResponse | null>(null);

    const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
    const [editPurchaseOrder, setEditPurchaseOrder] = useState("");
    const [editBillTo, setEditBillTo] = useState("");
    const [editInvoiceDate, setEditInvoiceDate] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editNotesPaymentTerms, setEditNotesPaymentTerms] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const loadInvoices = useCallback(async () => {
        setFetching(true);

        try {
            const data = await getInvoiceService();
            const result = Array.isArray(data) ? data : [];

            setInvoices(result);
            onDataLoad?.(result);
        } catch (error: unknown) {
            console.error("Failed to fetch invoices:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch invoices."
            );
        } finally {
            setFetching(false);
        }
    }, [onDataLoad]);

    useEffect(() => {
        if (isFilterActive) {
            setFetching(false);
            return;
        }

        void loadInvoices();
    }, [isFilterActive, loadInvoices]);

    useEffect(() => {
        if (refreshTrigger !== undefined && !isFilterActive) {
            void loadInvoices();
        }
    }, [refreshTrigger, isFilterActive, loadInvoices]);

    const dataToDisplay = isFilterActive
        ? filteredData ?? []
        : invoices;

    const isLoading = fetching && !isFilterActive;

    const formatDate = (date?: string | null) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatus = (invoice: InvoiceResponse) => {
        const item = invoice as ExtendedInvoice;
        return item.status || item.Status || "Active";
    };

    const renderStatus = (invoice: InvoiceResponse) => {
        const status = getStatus(invoice);
        const normalizedStatus = status.toLowerCase();

        const colors: Record<string, string> = {
            paid: "bg-green-100 text-green-700",
            sent: "bg-blue-100 text-blue-700",
            overdue: "bg-red-100 text-red-700",
            draft: "bg-gray-100 text-gray-700",
            active: "bg-orange-100 text-orange-700",
        };

        return (
            <span
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                    colors[normalizedStatus] ??
                    "bg-orange-100 text-orange-700"
                }`}
            >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                {status}
            </span>
        );
    };

    const getCurrencyDisplay = (invoice: InvoiceResponse) => {
        const item = invoice as ExtendedInvoice;

        if (item.currency?.symbol || item.currency?.currency) {
            return `${item.currency.symbol ?? ""} ${
                item.currency.currency ?? ""
            }`.trim();
        }

        return invoice.currency_id
            ? `ID: ${invoice.currency_id}`
            : "—";
    };

    const getCurrencySymbol = (invoice: InvoiceResponse) => {
        const item = invoice as ExtendedInvoice;
        return item.currency?.symbol || "";
    };

    const formatMoney = (
        amount: number,
        symbol: string,
        currencyCode?: string
    ) => {
        const formatted = amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return symbol
            ? `${symbol}${formatted}`
            : currencyCode
              ? `${currencyCode} ${formatted}`
              : formatted;
    };

    const getInvoiceTotals = (invoice: InvoiceResponse) => {
        const item = invoice as ExtendedInvoice;
        const items = item.items ?? [];

        const calculatedSubtotal = items.reduce((sum, row) => {
            const quantity = numberValue(row.quantity);
            const unitCost = numberValue(row.unit_cost);

            return sum + quantity * unitCost;
        }, 0);

        const subtotal =
            item.subtotal !== undefined && item.subtotal !== null
                ? numberValue(item.subtotal)
                : calculatedSubtotal;

        const taxPercentage = numberValue(item.tax_percentage);
        const discountAmount = numberValue(item.discount_amount);
        const shippingFee = numberValue(item.shipping_fee);

        const discountType = (item.discount_type ?? "")
            .toString()
            .toLowerCase();

        const discount =
            discountType.includes("percent") ||
            discountType === "%"
                ? (subtotal * discountAmount) / 100
                : discountAmount;

        const taxableAmount = Math.max(0, subtotal - discount);
        const tax = (taxableAmount * taxPercentage) / 100;

        const calculatedTotal =
            taxableAmount + tax + shippingFee;

        const total =
            item.grand_total !== undefined && item.grand_total !== null
                ? numberValue(item.grand_total)
                : item.total_amount !== undefined &&
                    item.total_amount !== null
                  ? numberValue(item.total_amount)
                  : calculatedTotal;

        return {
            subtotal,
            discount,
            taxPercentage,
            tax,
            shippingFee,
            total,
        };
    };

    const startEdit = (invoice: InvoiceResponse) => {
        setEditingSn(invoice.sn);
        setEditInvoiceNumber(invoice.invoice_number || "");
        setEditPurchaseOrder(invoice.purchase_order || "");
        setEditBillTo(invoice.bill_to || "");
        setEditInvoiceDate(invoice.invoice_date || "");
        setEditDueDate(invoice.due_date || "");
        setEditNotesPaymentTerms(invoice.notes_payment_terms || "");
        setViewInvoice(null);
    };

    const cancelEdit = () => {
        setEditingSn(null);
        setEditInvoiceNumber("");
        setEditPurchaseOrder("");
        setEditBillTo("");
        setEditInvoiceDate("");
        setEditDueDate("");
        setEditNotesPaymentTerms("");
    };

    const saveEdit = async (sn: string) => {
        if (!editInvoiceNumber.trim()) {
            toast.error("Invoice number is required.");
            return;
        }

        if (!editInvoiceDate) {
            toast.error("Invoice date is required.");
            return;
        }

        if (!editDueDate) {
            toast.error("Due date is required.");
            return;
        }

        try {
            setLoading(true);

            await updateInvoiceService(sn, {
                invoice_number: editInvoiceNumber,
                purchase_order: editPurchaseOrder,
                bill_to: editBillTo,
                invoice_date: editInvoiceDate,
                due_date: editDueDate,
                notes_payment_terms: editNotesPaymentTerms,
            });

            toast.success("Invoice updated successfully.");
            cancelEdit();

            if (isFilterActive) {
                onDataChange?.();
            } else {
                await loadInvoices();
            }

            onSuccess?.();
        } catch (error: unknown) {
            console.error("Failed to update invoice:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update invoice."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (sn: string) => {
        try {
            setLoading(true);

            const invoice = await getInvoiceBySnService(sn);
            setViewInvoice(invoice);
        } catch (error: unknown) {
            console.error("Failed to fetch invoice:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch invoice."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (sn: string) => {
        toast.info(
            `Invoice ${sn}: connect your deleteInvoiceService to enable deletion.`
        );
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setViewInvoice(null);
                cancelEdit();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const renderEditForm = (invoice: InvoiceResponse) => (
        <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
            <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-800">
                    Update Invoice
                </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                    {
                        label: "Invoice Number",
                        value: editInvoiceNumber,
                        setter: setEditInvoiceNumber,
                        type: "text",
                    },
                    {
                        label: "Purchase Order",
                        value: editPurchaseOrder,
                        setter: setEditPurchaseOrder,
                        type: "text",
                    },
                    {
                        label: "Bill To",
                        value: editBillTo,
                        setter: setEditBillTo,
                        type: "text",
                    },
                    {
                        label: "Invoice Date",
                        value: editInvoiceDate,
                        setter: setEditInvoiceDate,
                        type: "date",
                    },
                    {
                        label: "Due Date",
                        value: editDueDate,
                        setter: setEditDueDate,
                        type: "date",
                    },
                ].map((field) => (
                    <div key={field.label}>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            {field.label}
                        </label>

                        <input
                            type={field.type}
                            value={field.value}
                            onChange={(event) =>
                                field.setter(event.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>
                ))}

                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Notes / Payment Terms
                    </label>

                    <textarea
                        value={editNotesPaymentTerms}
                        onChange={(event) =>
                            setEditNotesPaymentTerms(event.target.value)
                        }
                        rows={2}
                        className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                    <X size={15} />
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={() => void saveEdit(invoice.sn)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? (
                        <ClipLoader size={13} color="#ffffff" />
                    ) : (
                        <Save size={15} />
                    )}
                    Save Changes
                </button>
            </div>
        </div>
    );

    const renderEmptyState = (mobile = false) => (
        <div
            className={`flex flex-col items-center justify-center text-center ${
                mobile
                    ? "rounded-xl border border-gray-100 bg-white px-4 py-12"
                    : "py-16"
            }`}
        >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-6 w-6 text-gray-400" />
            </div>

            <p className="text-base font-semibold text-gray-700">
                No data found
            </p>

            <p className="mt-1 text-sm text-gray-400">
                No invoices are available to display.
            </p>
        </div>
    );

    const renderInvoiceTemplate = (invoice: InvoiceResponse) => {
        const item = invoice as ExtendedInvoice;
        const currencySymbol = getCurrencySymbol(invoice);
        const currencyCode = item.currency?.currency;
        const items = item.items ?? [];
        const totals = getInvoiceTotals(invoice);

        return (
            <div className="invoice-print-area mx-auto w-full max-w-4xl bg-white text-gray-800">
                {/* Invoice header */}
                <div className="relative overflow-hidden bg-[#14383F] px-6 py-8 text-white sm:px-10">
                    <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
                    <div className="absolute -bottom-20 right-28 h-40 w-40 rounded-full border-[18px] border-white/5" />

                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F5C96A]">
                                Invoice
                            </p>

                            <h2 className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                                {invoice.invoice_number || "INVOICE"}
                            </h2>

                            <p className="mt-2 text-sm text-white/70">
                                {invoice.purchase_order
                                    ? `Purchase Order: ${invoice.purchase_order}`
                                    : "Payment invoice"}
                            </p>
                        </div>

                        <div className="sm:text-right">
                            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#F5C96A]">
                                {getStatus(invoice)}
                            </div>

                            <p className="mt-4 text-sm text-white/70">
                                Invoice Date
                            </p>
                            <p className="mt-1 text-base font-semibold">
                                {formatDate(invoice.invoice_date)}
                            </p>

                            <p className="mt-3 text-sm text-white/70">
                                Due Date
                            </p>
                            <p className="mt-1 text-base font-semibold">
                                {formatDate(invoice.due_date)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
                    {/* Billing information */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="h-5 w-1 rounded-full bg-[#F5C96A]" />
                                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#14383F]">
                                    From
                                </h3>
                            </div>

                            <div className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                {item.company_details || "Company details"}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="h-5 w-1 rounded-full bg-[#F5C96A]" />
                                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#14383F]">
                                    Bill To
                                </h3>
                            </div>

                            <div className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                {item.bill_to || "Customer details"}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14383F]">
                                Invoice Items
                            </h3>

                            <span className="text-xs text-gray-400">
                                {items.length}{" "}
                                {items.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-[#14383F] text-white">
                                        <th className="px-4 py-3 font-semibold">
                                            Description
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                                            Unit Cost
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Qty
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((row, index) => {
                                            const quantity = numberValue(
                                                row.quantity
                                            );
                                            const unitCost = numberValue(
                                                row.unit_cost
                                            );
                                            const amount =
                                                quantity * unitCost;

                                            return (
                                                <tr
                                                    key={index}
                                                    className={
                                                        index % 2 === 0
                                                            ? "bg-white"
                                                            : "bg-gray-50"
                                                    }
                                                >
                                                    <td className="border-b border-gray-100 px-4 py-4 font-medium text-gray-700">
                                                        {row.item_description ||
                                                            "Item"}
                                                    </td>

                                                    <td className="whitespace-nowrap border-b border-gray-100 px-4 py-4 text-right text-gray-600">
                                                        {formatMoney(
                                                            unitCost,
                                                            currencySymbol,
                                                            currencyCode
                                                        )}
                                                    </td>

                                                    <td className="border-b border-gray-100 px-4 py-4 text-center text-gray-600">
                                                        {quantity}
                                                    </td>

                                                    <td className="whitespace-nowrap border-b border-gray-100 px-4 py-4 text-right font-semibold text-gray-800">
                                                        {formatMoney(
                                                            amount,
                                                            currencySymbol,
                                                            currencyCode
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
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

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-gray-500">
                                    Subtotal
                                </span>
                                <span className="font-semibold text-gray-800">
                                    {formatMoney(
                                        totals.subtotal,
                                        currencySymbol,
                                        currencyCode
                                    )}
                                </span>
                            </div>

                            {totals.discount !== 0 && (
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-gray-500">
                                        Discount
                                    </span>
                                    <span className="font-semibold text-green-700">
                                        −
                                        {formatMoney(
                                            totals.discount,
                                            currencySymbol,
                                            currencyCode
                                        )}
                                    </span>
                                </div>
                            )}

                            {totals.taxPercentage !== 0 && (
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-gray-500">
                                        Tax ({totals.taxPercentage}%)
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                        {formatMoney(
                                            totals.tax,
                                            currencySymbol,
                                            currencyCode
                                        )}
                                    </span>
                                </div>
                            )}

                            {totals.shippingFee !== 0 && (
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-gray-500">
                                        Shipping Fee
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                        {formatMoney(
                                            totals.shippingFee,
                                            currencySymbol,
                                            currencyCode
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="border-t-2 border-[#14383F] pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-bold uppercase tracking-wider text-[#14383F]">
                                        Grand Total
                                    </span>
                                    <span className="text-xl font-bold text-[#14383F]">
                                        {formatMoney(
                                            totals.total,
                                            currencySymbol,
                                            currencyCode
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment and bank details */}
                    <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                        <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#14383F]">
                                Payment Terms
                            </h3>

                            <p className="whitespace-pre-line text-sm leading-6 text-gray-500">
                                {item.notes_payment_terms ||
                                    "Please make payment by the due date."}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#14383F]">
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
                            Please contact us if you have any questions
                            regarding this invoice.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Print styles: only the invoice template is printed. */}
            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 12mm;
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

                    .invoice-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        max-height: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .invoice-print-area table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .invoice-print-area tr {
                        break-inside: avoid;
                    }

                    .invoice-print-area thead {
                        display: table-header-group;
                    }
                }
            `}</style>

            {/* DESKTOP TABLE */}
            <div className="hidden w-full overflow-x-auto lg:block">
                <Table striped hoverable>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                S.N.
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Invoice Number
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Purchase Order
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Bill To
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Currency
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Invoice Date
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Due Date
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Status
                            </TableHeadCell>
                            <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                                Action
                            </TableHeadCell>
                        </TableRow>
                    </TableHead>

                    <TableBody className="divide-y">
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9}>
                                    <div className="flex justify-center py-12">
                                        <ClipLoader
                                            size={24}
                                            color="#f97316"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : dataToDisplay.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9}>
                                    {renderEmptyState()}
                                </TableCell>
                            </TableRow>
                        ) : (
                            dataToDisplay.map((invoice, index) => {
                                const isEditing =
                                    editingSn === invoice.sn;

                                return (
                                    <React.Fragment key={invoice.sn}>
                                        <TableRow>
                                            <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell>
                                                <span className="whitespace-nowrap text-sm font-semibold text-gray-800">
                                                    {invoice.invoice_number}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-sm text-gray-600">
                                                {invoice.purchase_order || "—"}
                                            </TableCell>

                                            <TableCell>
                                                <div
                                                    className="max-w-[200px] truncate text-sm text-gray-700"
                                                    title={invoice.bill_to || ""}
                                                >
                                                    {invoice.bill_to || "—"}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                    {getCurrencyDisplay(invoice)}
                                                </span>
                                            </TableCell>

                                            <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(invoice.invoice_date)}
                                            </TableCell>

                                            <TableCell className="whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(invoice.due_date)}
                                            </TableCell>

                                            <TableCell>
                                                {renderStatus(invoice)}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleView(invoice.sn)
                                                        }
                                                        disabled={loading}
                                                        title="Preview Invoice"
                                                        aria-label="Preview Invoice"
                                                        className="text-[#14383F] transition hover:text-blue-700 disabled:opacity-50"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEdit(invoice)
                                                        }
                                                        title="Edit Invoice"
                                                        aria-label="Edit Invoice"
                                                        className="text-orange-500 transition hover:text-orange-700"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(invoice.sn)
                                                        }
                                                        disabled={loading}
                                                        title="Delete Invoice"
                                                        aria-label="Delete Invoice"
                                                        className="text-red-500 transition hover:text-red-700 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isEditing && (
                                            <TableRow>
                                                <TableCell colSpan={9}>
                                                    {renderEditForm(invoice)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MOBILE VIEW */}
            <div className="space-y-4 lg:hidden">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <ClipLoader size={24} color="#f97316" />
                    </div>
                ) : dataToDisplay.length === 0 ? (
                    renderEmptyState(true)
                ) : (
                    dataToDisplay.map((invoice, index) => {
                        const isEditing = editingSn === invoice.sn;

                        return (
                            <div
                                key={invoice.sn}
                                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-400">
                                            S.N. {index + 1}
                                        </p>
                                        <p className="break-words text-sm font-bold text-gray-800">
                                            {invoice.invoice_number}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleView(invoice.sn)
                                            }
                                            disabled={loading}
                                            title="Preview Invoice"
                                            aria-label="Preview Invoice"
                                            className="text-[#14383F] disabled:opacity-50"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => startEdit(invoice)}
                                            title="Edit Invoice"
                                            aria-label="Edit Invoice"
                                            className="text-orange-500"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(invoice.sn)}
                                            disabled={loading}
                                            title="Delete Invoice"
                                            aria-label="Delete Invoice"
                                            className="text-red-500 disabled:opacity-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    renderEditForm(invoice)
                                ) : (
                                    <>
                                        {[
                                            {
                                                label: "Purchase Order",
                                                value: invoice.purchase_order || "—",
                                            },
                                            {
                                                label: "Bill To",
                                                value: invoice.bill_to || "—",
                                            },
                                            {
                                                label: "Currency",
                                                value: getCurrencyDisplay(invoice),
                                            },
                                            {
                                                label: "Invoice Date",
                                                value: formatDate(invoice.invoice_date),
                                            },
                                            {
                                                label: "Due Date",
                                                value: formatDate(invoice.due_date),
                                            },
                                        ].map((field) => (
                                            <div
                                                key={field.label}
                                                className="flex items-start justify-between gap-3"
                                            >
                                                <span className="text-xs text-gray-500">
                                                    {field.label}
                                                </span>
                                                <span className="max-w-[65%] break-words text-right text-sm text-gray-700">
                                                    {field.value}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                            <span className="text-xs text-gray-500">
                                                Status
                                            </span>
                                            {renderStatus(invoice)}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* INVOICE PREVIEW MODAL */}
            {viewInvoice && (
                <div
                    className="no-print fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"
                    onClick={() => setViewInvoice(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invoice-preview-title"
                        className="relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal toolbar */}
                        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14383F]/10">
                                    <FileText className="h-5 w-5 text-[#14383F]" />
                                </div>

                                <div>
                                    <h2
                                        id="invoice-preview-title"
                                        className="text-base font-bold text-gray-800 sm:text-lg"
                                    >
                                        Invoice Preview
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {viewInvoice.invoice_number}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#14383F] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1b4b53] sm:px-4"
                                >
                                    <Printer size={16} />
                                    <span>Print</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#F5C96A] px-3 py-2 text-sm font-semibold text-[#14383F] transition hover:bg-[#edbd4e] sm:px-4"
                                >
                                    <Download size={16} />
                                    <span className="hidden sm:inline">
                                        Save as PDF
                                    </span>
                                    <span className="sm:hidden">PDF</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setViewInvoice(null)}
                                    aria-label="Close invoice preview"
                                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable invoice preview */}
                        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 p-3 sm:p-6">
                            {renderInvoiceTemplate(viewInvoice)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
