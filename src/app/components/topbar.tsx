"use client";

import {
  ChevronDown,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBalanceVisibility } from "../context/BalanceHideShowContext";
import BASE_URL from "../urlConfig/urlConfig";

export default function TopNav() {
  const { collapsed } = useSidebar();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { isVisible, toggleVisibility } = useBalanceVisibility();
  const { user, logout } = useAuth();

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

  // Build the complete URL for the user's uploaded logo.
  const logoPath = user?.logo_uploads?.trim();

  const userLogoUrl = logoPath
    ? `${BASE_URL.replace(/\/+$/, "")}/${logoPath.replace(/^\/+/, "")}`
    : "/user.svg";

  const handleLogout = () => {
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict";

    logout();

    window.location.href = "/authentication/login";
  };

  return (
    <div
      className={`text-white h-16 bg-[#082c28] shadow-lg z-40 flex items-center justify-between px-3 fixed top-0 right-0 left-0 transition-all duration-500 ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}
    >
      {/* Logo - Hidden on mobile */}
      <Link
        href="/dashboard"
        className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img
          src="/app-logo.png"
          alt="Expense Tracker"
          className="h-10 object-contain"
        />
      </Link>

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

      <div className="flex items-center gap-2 pr-2 md:gap-3">
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
              <img
                src={userLogoUrl}
                alt="User profile"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-125 cursor-pointer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/user.svg";
                }}
              />
            </div>

            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full" />
          </div>

          <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer transition-transform duration-200" />

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-(--color1) rounded-lg shadow-lg py-2 z-50">
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
                onClick={handleLogout}
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