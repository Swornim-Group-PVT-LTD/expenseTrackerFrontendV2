"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";

import { getFilteredCardsDataService } from "../services/cardFitlerService";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface StatCardProps {
  icon: string;
  label: "income" | "expenses" | "saving" | "investment";
  labelColor: string;
}

type FilterType = "daily" | "weekly" | "monthly" | "yearly" | "total";

const periodText: Record<FilterType, string> = {
  daily: "Today",
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year",
  total: "Total",
};

const labelTitle: Record<StatCardProps["label"], string> = {
  income: "Total Income",
  expenses: "Total Expenses",
  saving: "Total Savings",
  investment: "Total Investments",
};

export default function StatCard({
  icon,
  label,
  labelColor,
}: StatCardProps) {
  const { t } = useTranslation();
  const { isVisible } = useBalanceVisibility();

  const getInitialValue = (label: string): FilterType => {
    switch (label.toLowerCase()) {
      case "income":
        return "monthly";

      case "expenses":
        return "monthly";

      case "saving":
        return "total";

      case "investment":
        return "total";

      default:
        return "total";
    }
  };

  const [filterType, setFilterType] = useState<FilterType>(() =>
    getInitialValue(label)
  );

  const [value, setValue] = useState<number>(0);
  const [changePercent, setChangePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("Rs");

  useEffect(() => {
    let ignore = false;

    getFilteredCardsDataService(filterType, label)
      .then((response) => {
        if (ignore) return;
        setValue(Number(response[`total_${label}`] ?? 0));
        setCurrency(response.currency?.symbol || "Rs");
        setChangePercent(
          typeof response.change_percent === "number" ? response.change_percent : null,
        );
      })
      .catch((error) => {
        if (ignore) return;
        console.error(`Failed to fetch ${label} data:`, error);
        setValue(0);
        setChangePercent(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [filterType, label]);

  const renderBalanceValue = () => {
    if (loading) {
      return <ClipLoader size={20} color={labelColor} />;
    }

    return maskAmount(value, isVisible, currency);
  };

  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <article className="@container flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Top section */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div
            className="size-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${labelColor}1A` }}
          >
            <img
              src={icon}
              alt=""
              className="size-6 object-contain"
            />
          </div>

          {/* Title + amount */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#082c28]">
              {t(labelTitle[label])}
            </span>

            <span className="break-words text-xl font-bold tracking-tight text-[#07371B] tabular-nums @min-[15rem]:text-2xl">
              {renderBalanceValue()}
            </span>

            <span className="text-xs text-slate-600">
              {t(periodText[filterType])}
            </span>
          </div>
        </div>

        {/* Percentage */}
        {changePercent !== null && (
          <div className="flex flex-col items-end shrink-0">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold"
              style={{
                backgroundColor: isPositive ? "#E6F4EA" : "#FCE8E6",
                color: isPositive ? "#2E7D32" : "#C62828",
              }}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}

              {Math.abs(changePercent)}%
            </div>

            <span className="text-xs text-slate-600 mt-1">
              {t("vs last month")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="relative">
          <select
            aria-label={t("Period for {{name}}", { name: t(labelTitle[label]) })}
            value={filterType}
            onChange={(event) => {
              setLoading(true);
              setChangePercent(null);
              setFilterType(event.target.value as FilterType);
            }}
            className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-2.5 text-sm font-medium text-[#082c28] focus-visible:outline-2 focus-visible:outline-[#056455]"
          >
            <option value="yearly">{t("Yearly")}</option>
            <option value="monthly">{t("Monthly")}</option>
            <option value="weekly">{t("Weekly")}</option>
            <option value="daily">{t("Daily")}</option>
            <option value="total">{t("Total")}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        </div>
        <Link
          href={`/dashboard/${label}`}
          aria-label={t("View details for {{name}}", { name: t(labelTitle[label]) })}
          className="inline-flex items-center gap-1 rounded text-sm font-semibold text-[#056455] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
        >
          {t("View details")}{" "} <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
