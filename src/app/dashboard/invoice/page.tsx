"use client";

import { useState } from "react";
import InvoiceForm from "../invoice/components/invoiceForm"; // Adjust the import path as necessary

export default function Page() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="p-4 mt-5">
            {!showForm ? (
                <>
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Add Invoice
                    </button>
                </>
            ) : (
                <InvoiceForm />
            )}
        </div>
    );
}