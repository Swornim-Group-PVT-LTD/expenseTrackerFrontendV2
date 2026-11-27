"use client";

import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Bell,
  Settings,
  UserRound,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBalanceVisibility } from "../context/BalanceHideShowContext";
import AccountLogo from "./AccountLogo";

export default function TopNav() {
  const { t } = useTranslation();
  const { collapsed } = useSidebar();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isVisible, toggleVisibility } = useBalanceVisibility();
  const { user, logout } = useAuth();
  const accountType = user?.user_type?.trim().toLowerCase();
  const showHeaderLogo = Boolean(user) && accountType !== "i" && accountType !== "individual";

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#082c28] px-4 text-white shadow-sm transition-[margin] duration-500 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}
    >
      <Link
        href="/dashboard"
        aria-label={t("Expense Tracker dashboard")}
        className="mr-2 flex w-24 shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 md:hidden"
      >
        <img src="/app-logo.png" alt="" className="h-9 max-w-full object-contain" />
      </Link>

      {showHeaderLogo && (
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <AccountLogo
            fallback="/app-logo.png"
            alt={t("Expense Tracker")}
            className="h-10 max-w-40 object-contain"
          />
        </Link>
      )}

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
        <div ref={dropdownRef} className="relative min-w-0">
          <button
            type="button"
            aria-label={t("Account options")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            className="flex max-w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {user?.first_name && (
              <span className="min-w-0 truncate text-sm font-semibold">
                <span className="hidden text-teal-100/75 lg:inline">{t("Welcome back,")}{" "} </span>
                {user.first_name}
              </span>
            )}
            <span className="size-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-[#eff0f3]">
              <AccountLogo
                fallback="/user.svg"
                alt=""
                className="size-full object-cover"
              />
            </span>
            <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-teal-100/80 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#103b35] p-1.5 shadow-xl z-50">
              <Link
                href="/dashboard/profile"
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <UserRound className="h-4 w-4 mr-2" aria-hidden="true" />
                {t("Profile")}
              </Link>
              <button
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg text-white hover:bg-white/10"
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t("Settings")}
              </button>

              <button
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {t("Help & Support")}
              </button>

              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("Logout")}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:size-10">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#f7bd51] ring-2 ring-[#082c28]">
            <span className="text-[#082c28] text-[8px] font-bold">
              1
            </span>
          </div>
        </div>

        {/* Balance visibility toggle */}
        <button
          onClick={toggleVisibility}
          aria-label={isVisible ? t("Hide balances") : t("Show balances")}
          title={isVisible ? t("Hide balances") : t("Show balances")}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-amber-300 md:size-10"
        >
          {isVisible ? (
            <Eye size={18} className="md:w-5 md:h-5" />
          ) : (
            <EyeOff size={18} className="md:w-5 md:h-5" />
          )}
        </button>
      </div>
    </header>
  );
}