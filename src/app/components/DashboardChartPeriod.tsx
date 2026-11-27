"use client";

import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

export default function DashboardChartPeriod({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-2.5 text-sm font-medium text-[#082c28] focus-visible:outline-2 focus-visible:outline-[#056455]"
      >
        <option value="yearly">{t("Yearly")}</option>
        <option value="monthly">{t("Monthly")}</option>
        <option value="weekly">{t("Weekly")}</option>
        <option value="daily">{t("Daily")}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </div>
  );
}
