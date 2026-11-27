import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
// @ts-ignore
import "./globals.css";
import I18nProvider from "./i18n/I18nProvider";

import { AuthProvider } from "@/context/AuthContext";
import BalanceCard from "./components/BalanceCard";
import { BalanceVisibilityProvider } from "./context/BalanceHideShowContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nepaliFont = Noto_Sans_Devanagari({
  variable: "--font-nepali",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track Your Money",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nepaliFont.variable} antialiased`}
      >
        <BalanceVisibilityProvider>
          <AuthProvider>
            <I18nProvider>{children}</I18nProvider>
          </AuthProvider>
        </BalanceVisibilityProvider>
      </body>
    </html>
  );
}
