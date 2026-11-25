import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { dashboardBarChartService } from "../services/chartService";
import { useCurrency } from "@/app/context/CurrencyContext";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import DashboardChartPeriod from "./DashboardChartPeriod";

const categories = [
  { key: "income", name: "Income", color: "#056455" },
  { key: "expenses", name: "Expenses", color: "#C14354" },
  { key: "investment", name: "Investments", color: "#B87918" },
  { key: "saving", name: "Savings", color: "#28786E" },
] as const;

const compactNumber = new Intl.NumberFormat(undefined, { notation: "compact" });

export default function DashboardBarChart() {
  const [filterType, setFilterType] = useState("monthly");
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  useEffect(() => {
    let ignore = false;

    dashboardBarChartService(filterType)
      .then((response) => {
        if (ignore) return;
        setChartData(categories.map(({ key, name, color }) => ({
          name,
          color,
          value: Number(response[key]) || 0,
        })));
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Error fetching chart data:", error);
        setStatus("error");
      });

    return () => { ignore = true; };
  }, [filterType]);

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-[#082c28]">Financial activity</h2>
        <DashboardChartPeriod
          label="Financial activity period"
          value={filterType}
          onChange={(value) => {
            setStatus("loading");
            setFilterType(value);
          }}
        />
      </div>
      {status !== "ready" ? (
        <p role="status" className="grid h-64 place-items-center text-center text-sm text-slate-600">
          {status === "loading" ? "Loading financial activity…" : "Financial activity is unavailable."}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 4" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} interval={0} tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis width={46} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(value) => isVisible ? compactNumber.format(value) : "XXX"} />
            <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={(value) => [isVisible ? `${currency} ${Number(value).toLocaleString()}` : "XXX", "Amount"]} />
            <Bar dataKey="value" maxBarSize={64} radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
