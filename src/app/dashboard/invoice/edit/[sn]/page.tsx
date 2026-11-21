"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoiceForm from "../../components/invoiceForm";
import { getInvoiceBySnService } from "@/app/services/invoiceService";
import type { InvoiceResponse } from "@/app/types/invoiceType";

export default function EditInvoicePage() {
    const { sn } = useParams<{ sn: string }>();

    return <InvoiceEditor key={sn} sn={sn} />;
}

function InvoiceEditor({ sn }: { sn: string }) {
    const router = useRouter();
    const [edit, setEdit] = useState<{ sn: string; invoice: InvoiceResponse }>();
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getInvoiceBySnService(sn).then((response) => {
            if (!active) return;
            const invoice = (response.data ?? response) as InvoiceResponse;
            if (!invoice.invoice_date) {
                setError("The invoice details are missing.");
                return;
            }
            setEdit({ sn, invoice });
        }).catch((requestError: unknown) => {
            if (active) {
                setError(requestError instanceof Error ? requestError.message : "Could not load the invoice.");
            }
        });

        return () => {
            active = false;
        };
    }, [sn]);

    return (
        <div className="mt-5 space-y-5 p-4">
            <h1 className="text-xl font-bold text-[#14383F]">Edit Invoice</h1>
            {error && <p role="alert" className="text-red-700">{error}</p>}
            {!edit && !error && <p role="status">Loading invoice…</p>}
            {edit && <InvoiceForm edit={edit} onSuccess={() => router.replace("/dashboard/invoice")} />}
        </div>
    );
}
