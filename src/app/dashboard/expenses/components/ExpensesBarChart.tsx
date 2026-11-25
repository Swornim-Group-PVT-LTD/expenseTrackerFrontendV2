import { useState, useEffect } from "react";
import { monthlyBarChartService } from "@/app/services/chartService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useCurrency } from "@/app/context/CurrencyContext";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";

const compactNumber = new Intl.NumberFormat(undefined, { notation: "compact" });

const MonthlyExpenseChart = ({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<
    { month: string; amount: number }[]
  >([]);
  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  useEffect(() => {
    const fetchMonthlyExpenses = async () => {
      try {
        const response = await monthlyBarChartService("expenses");
        const transformedData = response.months.map(
          (month: string, index: number) => ({
            month: month.substring(0, 3),
            amount: Number(response.totals[index]),
          }),
        );

        // Get only the latest 4 months with non-zero data
        const filteredData = transformedData.slice(-4);
        setMonthlyExpenses(filteredData);
      } catch (error) {
        console.error("Error fetching monthly expenses:", error);
      }
    };

    fetchMonthlyExpenses();
  }, [refreshTrigger]);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">Monthly expenses</h2>
      <ResponsiveContainer width="100%" height={256}>
        <BarChart
          data={monthlyExpenses}
          margin={{ top: 22, right: 8, bottom: 4, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 4" />
          <YAxis
            width={48}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 11 }}
            tickFormatter={(value) => isVisible ? compactNumber.format(value) : "XXX"}
          />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "#475569", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              isVisible ? `${currency} ${Number(value).toLocaleString()}`.trim() : "XXX",
              "Expense",
            ]}
          />

          <Bar dataKey="amount" fill="#C14354" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {/* Amount labels at top of each bar */}
            <LabelList dataKey="amount" position="top" fill="#334155" fontSize={11} formatter={(value) => isVisible ? Number(value).toLocaleString() : "XXX"} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
};

export default MonthlyExpenseChart;
