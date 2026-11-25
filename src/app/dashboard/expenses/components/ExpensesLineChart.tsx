import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { dailyLineChartService } from "@/app/services/chartService";
import { useState, useEffect } from "react";
import { useCurrency } from "@/app/context/CurrencyContext";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";

const compactNumber = new Intl.NumberFormat(undefined, { notation: "compact" });

const ExpensesLineChart = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>(
    [],
  );
  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await dailyLineChartService("expenses");
        const transformedData = response.dates.map(
          (date: string, index: number) => ({
            day: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            amount: Number(response.totals[index]),
          }),
        );
        setChartData(transformedData);
      } catch (error) {
        console.error("Error fetching expense chart data:", error);
      }
    };
    fetchChartData();
  }, [refreshTrigger]);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">Daily expenses</h2>
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 4" />
          <YAxis
            width={48}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 11 }}
            tickFormatter={(value) => isVisible ? compactNumber.format(value) : "XXX"}
          />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "#475569", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              isVisible ? `${currency} ${Number(value).toLocaleString()}`.trim() : "XXX",
              "Expense",
            ]}
          />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#C14354"
            strokeWidth={3}
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
};

export default ExpensesLineChart;
