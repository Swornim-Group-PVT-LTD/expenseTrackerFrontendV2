"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  Wallet,
  ArrowUp,
  ArrowDown,
  PiggyBank,
  TrendingUp,
  Menu,
  LayoutDashboard,
  Folder,
  Plus,
  FileText,
  ReceiptText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const dashboardData = [
  {
    title: "dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-6 w-6" />,
    color: "bg-red-900",
  },
  {
    title: "balance",
    href: "/dashboard/balance",
    icon: <Wallet className="h-6 w-6" />,
    color: "bg-blue-800",
  },
  {
    title: "income",
    href: "/dashboard/income",
    icon: <ArrowUp className="h-6 w-6" />,
    color: "bg-green-500",
  },
  {
    title: "expenses",
    href: "/dashboard/expenses",
    icon: <ArrowDown className="h-6 w-6" />,
    color: "bg-red-500",
  },
  {
    title: "savings",
    href: "/dashboard/saving",
    icon: <PiggyBank className="h-6 w-6" />,
    color: "bg-[var(--color2)]",
  },
  {
    title: "investment",
    href: "/dashboard/investment",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "bg-blue-500",
  },
  {
    title: "catalogue",
    href: "/dashboard/catalogue",
    icon: <Folder className="h-6 w-6" />,
    color: "bg-blue-500",
  },
  {
    title: "statement",
    href: "/dashboard/statement",
    icon: <FileText className="h-6 w-6" />,
    color: "bg-purple-500",
  },
  {
    title: "invoice",
    href: "/dashboard/invoice",
    icon: <ReceiptText className="h-6 w-6" />,
    color: "bg-green-500",
  },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  // Get the logged-in user's type
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserType(user.user_type ?? null);
      }
    } catch (error) {
      console.error("Unable to read logged-in user information:", error);
      setUserType(null);
    }
  }, []);

  // Show Invoice only for user_type C
  const visibleDashboardData = dashboardData.filter(
    (item) => item.title !== "invoice" || userType === "C",
  );

  // Separate add categories from other navigation items
  const addCategories = visibleDashboardData.filter((item) =>
    ["income", "expenses", "savings", "investment"].includes(item.title),
  );

  const otherNavItems = visibleDashboardData.filter(
    (item) =>
      !["income", "expenses", "savings", "investment"].includes(item.title),
  );

  const isCurrentPage = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-white/10 bg-[#082c28] text-white transition-[width] duration-500 ease-in-out md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/10 px-4 ${
          collapsed ? "justify-center" : "gap-4"
        }`}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
            aria-expanded={!collapsed}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-50 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          {!collapsed && (
            <Link
              href="/dashboard"
              aria-label={t("Expense Tracker dashboard")}
              className="ml-auto flex min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <img src="/app-logo.png" alt="" className="h-10 max-w-full object-contain" />
            </Link>
          )}
        </div>

        <nav aria-label={t("Dashboard navigation")} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {visibleDashboardData.map((item) => {
            const isActive = isCurrentPage(item.href);
            const label = t(item.title);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-12 items-center overflow-hidden rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-300 ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  isActive
                    ? "bg-[#f7bd51] text-[#12332d] shadow-sm"
                    : "text-teal-50 hover:bg-white/10"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-[18px] ${
                    isActive ? "bg-[#12332d]/10" : "bg-white/10"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate capitalize">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label={t("Dashboard navigation")}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#082c28] pb-[env(safe-area-inset-bottom)] text-white shadow-lg md:hidden"
      >
        {showAddMenu && (
          <div id="mobile-add-menu" className="absolute inset-x-0 bottom-full rounded-t-2xl border-t border-white/10 bg-[#082c28] px-4 pt-4 pb-10">
            <div className="grid grid-cols-2 gap-4">
              {addCategories.map((item) => {
                const isActive = isCurrentPage(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setShowAddMenu(false)}
                    className="flex flex-col items-center justify-center rounded-lg p-2 text-xs focus-visible:outline-2 focus-visible:outline-amber-300"
                  >
                    <span aria-hidden="true" className={`rounded-lg p-2 ${isActive ? "border-2 border-(--color2)" : item.color}`}>
                      {item.icon}
                    </span>
                    <span className={`mt-1 capitalize ${isActive ? "font-semibold text-(--color2)" : ""}`}>
                      {t(item.title)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          aria-expanded={showAddMenu}
          aria-controls={showAddMenu ? "mobile-add-menu" : undefined}
          onClick={() => setShowAddMenu((open) => !open)}
          className="absolute bottom-[calc(100%-0.5rem)] left-1/2 flex min-h-10 -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-[#082c28] bg-[#056455] px-4 text-xs font-semibold shadow-lg focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          <Plus className={`size-4 transition-transform ${showAddMenu ? "rotate-45" : ""}`} aria-hidden="true" />
          {t("Add")}
        </button>

        <div className="flex h-20 items-center px-1">
          {otherNavItems.map((item) => {
            const isActive = isCurrentPage(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setShowAddMenu(false)}
                className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-300 [&_svg]:size-5 ${isActive ? "font-semibold text-(--color2)" : "text-white/80"}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="max-w-full break-words text-[10px] leading-tight capitalize">
                  {t(item.title)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
