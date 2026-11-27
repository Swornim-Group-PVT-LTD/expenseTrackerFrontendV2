"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { getMonthlyRemainingBalanceService } from "@/app/services/balanceService";
import type { MonthlyRemainingBalanceResponse } from "@/app/types/balanceType";
import { useCurrency } from "@/app/context/CurrencyContext";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";

const compactNumber = new Intl.NumberFormat(undefined, { notation: "compact" });

export default function RemainingBalanceChart({ refreshTrigger }: { refreshTrigger: number }) {
  const { t } = useTranslation();
  const [result, setResult] = useState<MonthlyRemainingBalanceResponse | null>();
  const [loadedRefresh, setLoadedRefresh] = useState<number | null>(null);
  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  useEffect(() => {
    let ignore = false;
    getMonthlyRemainingBalanceService()
      .then((response) => {
        if (!ignore) setResult(response);
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Failed to load monthly balance:", error);
        setResult(null);
      })
      .finally(() => {
        if (!ignore) setLoadedRefresh(refreshTrigger);
      });

    return () => { ignore = true; };
  }, [refreshTrigger]);

  const loading = loadedRefresh !== refreshTrigger;
  const chartData = result?.data ?? [];

  return (
    <section aria-labelledby="balance-chart-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="balance-chart-heading" className="text-lg font-bold tracking-tight text-[#082c28]">
          {t("Monthly remaining balance")}
        </h2>
        {!loading && result?.year && (
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">{result.year}</span>
        )}
      </div>

      {!loading && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={264}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 4" />
            <XAxis dataKey="month" tickFormatter={(month: string) => month.slice(0, 3)} axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis width={52} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} tickFormatter={(value) => isVisible ? compactNumber.format(value) : "XXX"} />
            <Tooltip
              cursor={{ stroke: "#cbd5e1" }}
              formatter={(value) => [isVisible ? `${currency} ${Number(value).toLocaleString()}`.trim() : "XXX", t("Remaining balance")]}
            />
            <Line
              type="monotone"
              dataKey="remaining_balance"
              stroke="#056455"
              strokeWidth={3}
              dot={{ fill: "#fff", stroke: "#056455", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p role="status" className="grid h-[264px] place-items-center text-center text-sm text-slate-600">
          {loading ? t("Loading monthly balance…") : result === null ? t("Monthly balance is unavailable.") : t("No monthly balance data yet.")}
        </p>
      )}
    </section>
  );
}
