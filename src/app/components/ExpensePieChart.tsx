"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Maximize2, X } from "lucide-react";

import { expensePieChartService } from "../services/chartService";
import { useCurrency } from "@/app/context/CurrencyContext";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import DashboardChartPeriod from "./DashboardChartPeriod";

const colors = ["#056455", "#C14354", "#D19528", "#46828A", "#755BB0", "#C6652A"];

const getDateRange = (filterType: string) => {
  const today = new Date();
  let startDate: Date;

  switch (filterType) {
    case "daily":
      startDate = new Date(today);
      break;
    case "weekly":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6); // Last 7 days
      break;
    case "monthly":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
      break;
    case "yearly":
      startDate = new Date(today.getFullYear(), 0, 1); // First day of current year
      break;
    default:
      startDate = new Date(today.getFullYear(), 0, 1);
  }

  return {
    start: startDate.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
};

export default function ExpensesPieChart() {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState("monthly");
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  useEffect(() => {
    let ignore = false;
    const dateRange = getDateRange(filterType);

    expensePieChartService(filterType, dateRange.start, dateRange.end)
      .then((response) => {
        if (ignore) return;
        setChartData((response.data ?? []).map(
          (item: { expense_category: string; total_amount: number | string }, index: number) => ({
            name: item.expense_category,
            value: Number(item.total_amount) || 0,
            color: colors[index % colors.length],
          }),
        ));
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error fetching expense pie chart data:", error);
        setStatus("error");
      });

    return () => { ignore = true; };
  }, [filterType]);

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const formatAmount = (value: number) =>
    isVisible ? `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim() : "XXX";

  const renderBreakdown = (expanded = false) => (
    <div className={`grid items-center gap-4 ${expanded ? "sm:grid-cols-2" : "@min-[27rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"}`}>
      <div className={`relative min-w-0 ${expanded ? "h-64 sm:h-80" : "h-52"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius="68%" outerRadius="95%" paddingAngle={1}>
              {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value) => formatAmount(Number(value))} wrapperStyle={{ zIndex: 2 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-[58%] break-words text-sm font-bold text-[#082c28] tabular-nums">{formatAmount(total)}</span>
          <span className="text-xs text-slate-600">{t("Total expenses")}</span>
        </div>
      </div>
      <ul className={`divide-y divide-slate-100 overflow-y-auto ${expanded ? "max-h-80" : "max-h-48"}`} aria-label={t("Expense categories")}>
        {chartData.map((entry) => (
          <li key={entry.name} className="flex items-start gap-2 py-2 pr-2 text-sm">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words text-slate-700">{entry.name}</span>
            <span className="shrink-0 font-semibold text-[#082c28] tabular-nums">{((entry.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const hasBreakdown = status === "ready" && total > 0;

  return (
    <div className="@container min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-[#082c28]">{t("Expense breakdown")}</h2>
        <div className="flex items-center gap-2">
          <DashboardChartPeriod
            label={t("Expense breakdown period")}
            value={filterType}
            onChange={(value) => {
              setStatus("loading");
              setFilterType(value);
            }}
          />
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.showModal();
              setExpanded(true);
            }}
            disabled={!hasBreakdown}
            aria-label={t("Expand expense breakdown")}
            className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-[#056455] hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-[#056455] disabled:cursor-default disabled:opacity-40"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {hasBreakdown ? (
        <div className="grid min-h-64 content-center">{renderBreakdown()}</div>
      ) : (
        <p role="status" className="grid h-64 place-items-center text-center text-sm text-slate-600">
          {status === "loading" ? t("Loading expense breakdown…") : status === "error" ? t("Expense breakdown is unavailable.") : t("No expenses for this period.")}
        </p>
      )}

      <dialog ref={dialogRef} onClose={() => setExpanded(false)} aria-labelledby="expanded-expense-title" className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl backdrop:bg-slate-900/60 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="expanded-expense-title" className="text-xl font-bold text-[#082c28]">{t("Expense breakdown")}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("Close expense breakdown")}
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-[#056455] hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-[#056455]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {hasBreakdown && expanded && renderBreakdown(true)}
      </dialog>
    </div>
  );
}
