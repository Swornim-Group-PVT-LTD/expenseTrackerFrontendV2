"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface InvoiceBreadcrumbsProps {
    page?: "Add Invoice" | "Edit Invoice";
    onReturnToList?: () => void;
}

const linkClass = "inline-flex items-center gap-1.5 rounded text-gray-600 hover:text-[#14383F] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-300 dark:hover:text-white";
const currentClass = "font-semibold text-gray-900 dark:text-white";

export default function InvoiceBreadcrumbs({ page, onReturnToList }: InvoiceBreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
                <li>
                    <Link href="/dashboard" className={linkClass}>
                        <Home size={16} aria-hidden="true" />
                        Dashboard
                    </Link>
                </li>
                <li className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />
                    {page ? (
                        <Link
                            href="/dashboard/invoice"
                            className={linkClass}
                            onNavigate={(event) => {
                                if (onReturnToList) {
                                    event.preventDefault();
                                    onReturnToList();
                                }
                            }}
                        >
                            Invoices
                        </Link>
                    ) : (
                        <span aria-current="page" className={currentClass}>Invoices</span>
                    )}
                </li>
                {page && (
                    <li className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />
                        <span aria-current="page" className={currentClass}>{page}</span>
                    </li>
                )}
            </ol>
        </nav>
    );
}
