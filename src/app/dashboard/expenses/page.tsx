"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";


import ExpenseForm from "./components/ExpenseForm";
import BalanceCard from "@/app/components/BalanceCard";
import ExpensesLineChart from "./components/ExpensesLineChart";
import DateFilter from "@/app/components/DateFilter";
import ExpenseTable from "./components/ExpenseTable";
import ExpensesBarChart from "./components/ExpensesBarChart";
import ThresholdForm from "./components/ThresholdForm";
import ViewThresholdModal from "./components/ViewThresholdModal";
import ExpenseThreshold from "./components/ThresholdCompariosion";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { getExpenseCategoriesService } from "@/app/services/catalogueServices/expenseCatalogueService";
import { ExpenseCategoryResponse } from "@/app/types/catalolgueType/expenseCatalogueType";

import { getExpenseByDateRangeService } from "@/app/services/expenseService";
import { ExpenseResponse } from "@/app/types/expenseType";
import { downloadService } from "@/app/services/downloadService";

function Expenses() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
  const [filteredData, setFilteredData] = useState<ExpenseResponse[]>([]);
  const [allData, setAllData] = useState<ExpenseResponse[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(true);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddThresholdOpen, setIsAddThresholdOpen] = useState(false);
  const [isViewThresholdOpen, setIsViewThresholdOpen] = useState(false);
  const [thresholdRefreshTrigger, setThresholdRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
    setRefreshTrigger((prev) => prev + 1);
    if (isFilterActive) {
      try {
        const response = await getExpenseByDateRangeService(
          currentDateRange?.start,
          currentDateRange?.end,
          currentCategory || undefined,
        );
        setFilteredData(response);
      } catch (error) {
        console.error("Failed to re-apply filter:", error);
      }
    }
  };

  const handleFilter = (
    data: ExpenseResponse[],
    startDate?: string,
    endDate?: string,
    category?: string, // NEW
  ) => {
    setFilteredData(data);
    setIsFilterActive(true);
    setCurrentDateRange(
      startDate && endDate ? { start: startDate, end: endDate } : null,
    );
    setCurrentCategory(category || null); // NEW state
  };

  const clearFilter = () => {
    setFilteredData([]);
    setIsFilterActive(false);
    setCurrentDateRange(null);
  };

  const handleThresholdSuccess = () => {
    setThresholdRefreshTrigger((prev) => prev + 1);
  };

  // Fetch income categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getExpenseCategoriesService();
        setCategories(data);
      } catch (err) {
        toast.error(t("Failed to fetch expense categories"));
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">{t("Expenses")}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsAddThresholdOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#f7bd51] px-4 py-2.5 text-sm font-semibold text-[#12332d] transition-colors hover:bg-[#edaf3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("Add Threshold")}
          </button>
          <button
            type="button"
            onClick={() => setIsViewThresholdOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#082c28] transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
          >
            <Eye className="size-4" aria-hidden="true" />
            {t("View Threshold")}
          </button>
        </div>
      </div>

      {/* Threshold Modals */}
      <ThresholdForm
        isOpen={isAddThresholdOpen}
        onClose={() => setIsAddThresholdOpen(false)}
        onSuccess={handleThresholdSuccess}
      />

      <ViewThresholdModal
        isOpen={isViewThresholdOpen}
        onClose={() => setIsViewThresholdOpen(false)}
        refreshTrigger={thresholdRefreshTrigger}
        onSuccess={handleThresholdSuccess}
      />

      <ExpenseForm
        onSuccess={handleRefresh}
        balanceCard={<BalanceCard refreshTrigger={refreshTrigger} />}
      />

      <ExpenseThreshold refreshTrigger={refreshTrigger + thresholdRefreshTrigger} />

      <section aria-label={t("Expense charts")} className="grid gap-4 xl:grid-cols-2">
        <ExpensesLineChart refreshTrigger={refreshTrigger} />
        <ExpensesBarChart refreshTrigger={refreshTrigger} />
      </section>

      <section aria-labelledby="expense-history-heading" className="space-y-3">
        <h2 id="expense-history-heading" className="text-lg font-bold tracking-tight text-[#082c28] dark:text-white">
          {t("Expense history")}
        </h2>
        <DateFilter
          initialFrom={
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
          initialTo={new Date()}
          fetchService={getExpenseByDateRangeService}
          onFilter={handleFilter}
          categories={categories}
          categoryKey="expense_category"
          exportColor="#C14354"
          onDownloadPDF={() => {
            const data = isFilterActive ? filteredData : allData;

            if (data.length === 0) {
              toast.warning(
                t("No data to download. Please apply filters or wait for data to load."),
              );
              return;
            }

            downloadService.downloadPDF(
              data,
              [
                { header: "ID", field: "id" },
                { header: "Expense", field: "add_expenses" },
                { header: "Category", field: "expense_category" },
                { header: "Total Expenses", field: "total_expenses" },
                { header: "Date", field: "created_date" },
              ],
              "Expense_Report",
            );
          }}
          onDownloadExcel={() => {
            const data = isFilterActive ? filteredData : allData;

            if (data.length === 0) {
              toast.warning(
                t("No data to download. Please apply filters or wait for data to load."),
              );
              return;
            }

            downloadService.downloadExcel(
              data,
              [
                { header: "ID", field: "id" },
                { header: t("Expense"), field: "add_expenses" },
                { header: t("Category"), field: "expense_category" },
                { header: t("Total Expenses"), field: "total_expenses" },
                { header: t("Date"), field: "created_date" },
              ],
              "Expense_Report",
            );
          }}
        />

        {isFilterActive && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {t("Showing {{count}} filtered results", { count: filteredData.length })}
            </span>

            <button
              onClick={clearFilter}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            >
              {t("Show All")}
            </button>
          </div>
        )}

        <ExpenseTable
          refreshTrigger={refreshTrigger}
          filteredData={isFilterActive ? (filteredData ?? undefined) : undefined}
          onSuccess={handleRefresh}
          onDataLoad={setAllData}
          isFilterActive={isFilterActive}
        />
      </section>
    </main>
  );
}

export default Expenses;
