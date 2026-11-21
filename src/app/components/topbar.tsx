"use client";

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
    <div
      className={`text-white h-16 bg-[#082c28] shadow-lg z-40 flex items-center justify-between px-3 fixed top-0 right-0 left-0 transition-all duration-500 ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}
    >
      {showHeaderLogo && (
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <AccountLogo
            fallback="/app-logo.png"
            alt="Expense Tracker"
            className="h-10 max-w-40 object-contain"
          />
        </Link>
      )}

      {/* Welcome message - Mobile */}
      <div className="md:hidden">
        <span className="text-white text-2xl font-bold">
          <span className="text-sm font-medium text-gray-200">
            Welcome back,
          </span>
          <br />
          {user?.first_name}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 pr-2 md:gap-3">
        {/* Welcome message - Desktop */}
        <span className="text-white text-lg font-bold hidden md:block">
          Welcome back, {user?.first_name}
        </span>

        {/* User profile dropdown */}
        <div
          className="relative flex items-center gap-1"
          onClick={() => setOpen(!open)}
          ref={dropdownRef}
        >
          {/* Profile image with hover zoom */}
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-[#EFF0F3] flex items-center justify-center overflow-hidden">
              <AccountLogo
                fallback="/user.svg"
                alt="User profile"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-125 cursor-pointer"
              />
            </div>

            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full" />
          </div>

          <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer transition-transform duration-200" />

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-(--color1) rounded-lg shadow-lg py-2 z-50">
              <Link
                href="/dashboard/profile"
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-(--color2)"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                }}
              >
                <UserRound className="h-4 w-4 mr-2" aria-hidden="true" />
                Profile
              </Link>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-(--color2)"
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>

              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-(--color2)"
                onClick={() => setOpen(false)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </button>

              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-(--color2)"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FDC300] rounded-full flex items-center justify-center">
            <span className="text-[#082c28] text-[8px] font-bold">
              1
            </span>
          </div>
        </div>

        {/* Balance visibility toggle */}
        <button
          onClick={toggleVisibility}
          aria-label={isVisible ? "Hide balances" : "Show balances"}
          title={isVisible ? "Hide balances" : "Show balances"}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white cursor-pointer bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isVisible ? (
            <Eye size={18} className="md:w-5 md:h-5" />
          ) : (
            <EyeOff size={18} className="md:w-5 md:h-5" />
          )}
        </button>
      </div>
    </div>
  );
}