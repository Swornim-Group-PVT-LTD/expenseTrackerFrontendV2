"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
    label: string;
    href: string;
    onNavigate?: () => void;
}

const linkClass = "inline-flex items-center gap-1.5 rounded text-gray-600 hover:text-[#14383F] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-300 dark:hover:text-white";

export default function Breadcrumbs({ parents = [], current }: {
    parents?: BreadcrumbItem[];
    current: string;
}) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
                {parents.map(({ label, href, onNavigate }, index) => (
                    <li key={href} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />}
                        <Link
                            href={href}
                            className={linkClass}
                            onNavigate={onNavigate && ((event) => {
                                event.preventDefault();
                                onNavigate();
                            })}
                        >
                            {href === "/dashboard" && <Home size={16} aria-hidden="true" />}
                            {label}
                        </Link>
                    </li>
                ))}
                <li className="flex items-center gap-2">
                    {parents.length > 0 && <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />}
                    <span aria-current="page" className="font-semibold text-gray-900 dark:text-white">
                        {current}
                    </span>
                </li>
            </ol>
        </nav>
    );
}
