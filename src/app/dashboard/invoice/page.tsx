"use client";

import { useEffect, useState } from "react";
import { X, FileText, Download } from "lucide-react";

import InvoiceForm from "../invoice/components/invoiceForm";
import InvoicesTable from "../invoice/components/viewInvoiceTable";
import InvoiceTemplate, {
    type InvoiceData,
    type InvoiceItem,
} from "../invoice/components/viewInvoiceTemplate";
import type { InvoiceResponse } from "@/app/types/invoiceType";

interface SelectedInvoice extends InvoiceData {
    items?: InvoiceItem[];
}

export default function Page() {
    const [showForm, setShowForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] =
        useState<SelectedInvoice | null>(null);

    useEffect(() => {
        if (!selectedInvoice) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedInvoice(null);
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [selectedInvoice]);

    const handleViewInvoice = (invoice: InvoiceResponse) => {
        setSelectedInvoice(invoice as unknown as SelectedInvoice);
    };

    return (
        <div className="mt-5 space-y-5 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[#14383F]">
                        Invoice Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Create, manage, view and download invoices.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="rounded-lg bg-[#14383F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20515A]"
                    >
                        + Add Invoice
                    </button>
                )}
            </div>

            {showForm && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[#14383F]">
                            Add Invoice
                        </h2>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>

                    <InvoiceForm />
                </div>
            )}

            <div className="w-full">
                <InvoicesTable onViewInvoice={handleViewInvoice} />
            </div>

            {selectedInvoice && (
                <div
                    className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedInvoice(null);
                        }
                    }}
                >
                    <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3C4] text-[#14383F]">
                                    <FileText size={21} />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="font-bold text-[#14383F]">
                                        Invoice Preview
                                    </h2>
                                    <p className="truncate text-xs text-gray-500">
                                        {selectedInvoice.invoice_number ||
                                            "Invoice"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedInvoice(null)}
                                aria-label="Close invoice preview"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100">
                            <InvoiceTemplate
                                invoice={selectedInvoice}
                                items={selectedInvoice.items ?? []}
                                currencySymbol={
                                    selectedInvoice.currency_symbol ||
                                    selectedInvoice.currency ||
                                    "Rs."
                                }
                            />
                        </div>

                        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3">
                            <button
                                type="button"
                                onClick={() => setSelectedInvoice(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex items-center gap-2 rounded-lg bg-[#14383F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20515A]"
                            >
                                <Download size={16} />
                                Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    @page {
                        size: A4;
                        margin: 12mm;
                    }
                }
            `}</style>
        </div>
    );
}