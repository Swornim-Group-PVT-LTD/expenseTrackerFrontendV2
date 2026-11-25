"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Breadcrumbs from "@/app/components/Breadcrumbs";
import InvoiceForm from "../invoice/components/invoiceForm";
import InvoicesTable from "../invoice/components/viewInvoiceTable";
import InvoiceTemplate from "../invoice/components/viewInvoiceTemplate";

import type { InvoiceResponse } from "@/app/types/invoiceType";

export default function Page() {
    const [showForm, setShowForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] =
        useState<InvoiceResponse | null>(null);

    useEffect(() => {
        if (!selectedInvoice) {
            return;
        }

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
        setSelectedInvoice(invoice);
    };

    const handleClosePreview = () => {
        setSelectedInvoice(null);
    };

    return (
        <main className="mt-4 space-y-5">
            <Breadcrumbs
                parents={[
                    { label: "Dashboard", href: "/dashboard" },
                    ...(showForm ? [{
                        label: "Invoices",
                        href: "/dashboard/invoice",
                        onNavigate: () => setShowForm(false),
                    }] : []),
                ]}
                current={showForm ? "Add Invoice" : "Invoices"}
            />

            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">
                        {showForm ? "New invoice" : "Invoices"}
                    </h1>

                </div>

                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#056455] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#034e43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
                    >
                        <Plus className="size-4" aria-hidden="true" /> Add Invoice
                    </button>
                )}
            </div>

            {/* Invoice Form */}
            {showForm ? (
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

                    <InvoiceForm onSuccess={() => setShowForm(false)} />
                </div>
            ) : (
                <div className="w-full">
                    <InvoicesTable onViewInvoice={handleViewInvoice} />
                </div>
            )}

            {selectedInvoice && (
                <InvoiceTemplate
                    invoice={selectedInvoice}
                    onClose={handleClosePreview}
                />
            )}
        </main>
    );
}