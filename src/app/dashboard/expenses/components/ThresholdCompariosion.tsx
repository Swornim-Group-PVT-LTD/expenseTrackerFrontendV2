import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { compareThresholdWithExpensesService } from "@/app/services/thresholdService";
import { CompareExpenseAndThresholdResponse } from "@/app/types/thresholdType";

import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface ExpenseThresholdProps {
  refreshTrigger?: number;
}

const ExpenseThreshold: React.FC<ExpenseThresholdProps> = ({
  refreshTrigger = 0,
}) => {
  const [filter, setFilter] = useState("monthly");
  const [data, setData] = useState<CompareExpenseAndThresholdResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isVisible } = useBalanceVisibility();

  const fetchData = async (filterType: string) => {
    setLoading(true);
    setError(null);
    try {
      const responseData =
        await compareThresholdWithExpensesService(filterType);
      setData(responseData);
    } catch (error: any) {
      // Check if it's a "no active threshold" error - treat as no data instead of error
      const errorMessage = error.message || "";
      const isNoThresholdError =
        errorMessage.toLowerCase().includes("no active") ||
        errorMessage.toLowerCase().includes("no threshold") ||
        errorMessage.toLowerCase().includes("not found");

      if (isNoThresholdError) {
        // This is expected when no threshold exists, not a real error
        setData(null);
        setError(null);
      } else {
        // This is an actual error (network, server, etc.)
        console.error("Error fetching threshold comparison data:", error);
        setError(errorMessage || "Failed to load threshold data");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filter);
  }, [filter, refreshTrigger]);

  const percentUsed = Math.max(0, Number(data?.percent_used) || 0);
  const progressWidth = Math.min(percentUsed, 100);
  const isExceeded = Number(data?.exceeded_amount) > 0;
  const formatAmount = (amount: number) => maskAmount(Number(amount) || 0, isVisible, data?.symbol);

  return (
    <section aria-labelledby="expense-limit-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-busy={loading}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="expense-limit-heading" className="text-lg font-bold tracking-tight text-[#082c28]">Spending limit</h2>
          {!loading && data && <span className="text-xl font-bold text-red-600 tabular-nums">{formatAmount(data.threshold_amount)}</span>}
        </div>
        <select
          aria-label="Spending limit period"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-[#082c28] focus-visible:outline-2 focus-visible:outline-[#056455]"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {loading ? (
        <p role="status" className="text-sm text-slate-600">Loading spending limit…</p>
      ) : error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : data ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
            <span><strong>Spent</strong> {formatAmount(data.total_expenses)}</span>
            <strong className="tabular-nums">{percentUsed.toFixed(1)}% used</strong>
          </div>
          <div
            role="progressbar"
            aria-label="Spending limit used"
            aria-valuenow={progressWidth}
            aria-valuetext={`${percentUsed.toFixed(1)}% used`}
            className="h-3 overflow-hidden rounded-full bg-slate-100"
          >
            <div className="h-full rounded-full bg-red-600 transition-[width] motion-reduce:transition-none" style={{ width: `${progressWidth}%` }} />
          </div>
          {!isExceeded && (
            <p className="text-sm text-slate-700"><strong>Remaining</strong> {formatAmount(data.remaining_amount)}</p>
          )}
          {data.warning && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {isExceeded ? (
                  <><strong>{formatAmount(data.exceeded_amount)}</strong> over your {filter} limit.</>
                ) : percentUsed >= 100 ? (
                  <>You’ve reached your {filter} spending limit.</>
                ) : (
                  <>You’re approaching your {filter} spending limit.</>
                )}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No active {filter} threshold. Use Add Threshold to set one.</p>
      )}
    </section>
  );
};

export default ExpenseThreshold;
