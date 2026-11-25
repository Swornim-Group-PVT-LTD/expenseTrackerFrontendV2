"use client";

import { ArrowDown, ArrowUp, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";
import Link from "next/link";

import BalanceCard from "@/app/components/BalanceCard";
import MonthlyBarChart from "@/app/components/DashboardBarChart";
import ExpensesPieChart from "@/app/components/ExpensePieChart";
import StatCard from "@/app/components/statcard";

const sections = [
  { label: "income", title: "Income", Icon: ArrowUp, color: "#056455", icon: "/income-logo.svg" },
  { label: "expenses", title: "Expenses", Icon: ArrowDown, color: "#C14354", icon: "/expenses-logo.svg" },
  { label: "saving", title: "Savings", Icon: PiggyBank, color: "#28786E", icon: "/saving-logo.svg" },
  { label: "investment", title: "Investments", Icon: TrendingUp, color: "#996308", icon: "/investment-logo.svg" },
] as const;

export default function Dashboard() {
  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">
        Dashboard
      </h1>

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <BalanceCard refreshTrigger={0} />

        <nav aria-label="Quick links" className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
          {sections.map(({ label, title, Icon, color }) => (
            <Link
              key={label}
              href={`/dashboard/${label}`}
              className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-base font-semibold text-[#082c28] transition-colors hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] sm:px-3"
            >
              <span className="grid size-9 shrink-0 sm:size-10 place-items-center rounded-lg" style={{ backgroundColor: `${color}19`, color }}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 break-words">{title}</span>
              <ArrowUpRight className="ml-auto hidden size-4 shrink-0 text-slate-400 group-hover:text-[#056455] sm:block" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>

      <section aria-label="Financial totals" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {sections.map(({ label, icon, color }) => (
          <StatCard key={label} icon={icon} label={label} labelColor={color} />
        ))}
      </section>

      <section aria-label="Financial charts" className="grid gap-4 xl:grid-cols-2">
        <MonthlyBarChart />
        <ExpensesPieChart />
      </section>
    </main>
  );
}
