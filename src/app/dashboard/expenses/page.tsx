"use client";

import { useState } from "react";

import { Home } from "lucide-react";

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
        toast.error("Failed to fetch expense categories");
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="">
      <div className="flex items-center gap-1 text-md mb-1 md:mb-4 mt-4">
        <Home className="w-4 h-4" />
        <span>/Add Expenses</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {/* Add Threshold */}
        <button
          onClick={() => setIsAddThresholdOpen(true)}
          className="group inline-flex items-center gap-2 rounded-lg bg-[#FFAA00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e99b00] hover:shadow-md active:translate-y-0"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-base leading-none">
            +
          </span>
          Add Threshold
        </button>

        {/* View Threshold */}
        <button
          onClick={() => setIsViewThresholdOpen(true)}
          className="group inline-flex items-center gap-2 rounded-lg border border-[#133840]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#133840] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#133840] hover:bg-[#133840] hover:text-white hover:shadow-md active:translate-y-0"
        >
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Threshold
        </button>
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

      <div className="grid grid-cols-1 items-center lg:grid-cols-4 gap-4">
        <BalanceCard refreshTrigger={refreshTrigger} />
        <ExpenseForm onSuccess={handleRefresh} />
      </div>

      {/* Threshold Comparison Section */}
      <div className="my-4">
        <ExpenseThreshold
          refreshTrigger={refreshTrigger + thresholdRefreshTrigger}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
        <div className="h-80">
          <ExpensesLineChart refreshTrigger={refreshTrigger} />
        </div>

        <div className="h-80">
          <ExpensesBarChart refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Added mt-10 here */}
      <div className="mt-10">
        <DateFilter
          initialFrom={
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
          initialTo={new Date()}
          fetchService={getExpenseByDateRangeService}
          onFilter={handleFilter}
          categories={categories}
          categoryKey="expense_category"
          onDownloadPDF={() => {
            const data = isFilterActive ? filteredData : allData;

            if (data.length === 0) {
              toast.warning(
                "No data to download. Please apply filters or wait for data to load.",
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
                "No data to download. Please apply filters or wait for data to load.",
              );
              return;
            }

            downloadService.downloadExcel(
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
        />
      </div>

      {isFilterActive && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {filteredData.length} filtered results
          </span>

          <button
            onClick={clearFilter}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            Show All
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
    </div>
  );
}

export default Expenses;
