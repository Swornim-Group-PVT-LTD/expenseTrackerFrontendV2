"use client";

import { usePathname } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";

const dashboard = { label: "Dashboard", href: "/dashboard" };
const catalogue = { label: "Catalogue", href: "/dashboard/catalogue" };
const invoices = { label: "Invoices", href: "/dashboard/invoice" };

const pageLabels: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/balance": "Balance",
    "/dashboard/income": "Income",
    "/dashboard/expenses": "Expenses",
    "/dashboard/saving": "Savings",
    "/dashboard/investment": "Investments",
    "/dashboard/statement": "Statement",
    "/dashboard/profile": "Profile",
    "/dashboard/catalogue": "Catalogue",
    "/dashboard/catalogue/incomeCatalogue": "Income Catalogue",
    "/dashboard/catalogue/expenseCatalogue": "Expense Catalogue",
    "/dashboard/catalogue/savingCatalogue": "Saving Catalogue",
    "/dashboard/catalogue/investmentCatalogue": "Investment Catalogue",
    "/dashboard/catalogue/currencyCatalogue": "Currency Catalogue",
};

export default function DashboardBreadcrumbs() {
    const pathname = usePathname();
    const isInvoiceEdit = /^\/dashboard\/invoice\/edit\/[^/]+$/.test(pathname);
    const current = isInvoiceEdit ? "Edit Invoice" : pageLabels[pathname];
    // The invoice list owns its breadcrumb because Add Invoice is an inline form.
    if (!current) return null;

    const parents = pathname === dashboard.href ? [] : [dashboard];
    if (isInvoiceEdit) parents.push(invoices);
    if (pathname.startsWith(catalogue.href + "/")) parents.push(catalogue);

    return (
        <div className="mb-4 mt-4">
            <Breadcrumbs parents={parents} current={current} />
        </div>
    );
}
