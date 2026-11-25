"use client";

import { useState, useEffect } from "react";
import SavingForm from "./components/SavingForm";
import BalanceCard from "@/app/components/BalanceCard";
import SavingLineChart from "./components/SavingLineChart";
import DateFilter from "@/app/components/DateFilter";
import SavingTransferForm from "./components/SavingTransferForm";
import SavingTable from "./components/SavingTable";
import SavingBarChart from "./components/SavingBarChart";
import { toast } from "react-toastify";
import { getSavingCategoriesService } from "@/app/services/catalogueServices/savingCatalogueService";
import { SavingCategoryResponse } from "@/app/types/catalolgueType/savingCatalogueType";
import { getSavingByDateRangeService } from "@/app/services/savingService";
import { SavingResponse } from "@/app/types/savingType";
import { downloadService } from "@/app/services/downloadService";

function Saving() {
  const [categories, setCategories] = useState<SavingCategoryResponse[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<SavingResponse[]>([]);
  const [selected, setSelected] = useState<SavingResponse[]>([]);
  const [allData, setAllData] = useState<SavingResponse[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
    setSelected([]);
    setRefreshTrigger((prev) => prev + 1);
    if (isFilterActive) {
      try {
        const response = await getSavingByDateRangeService(
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
    data: SavingResponse[],
    startDate?: string,
    endDate?: string,
    category?: string, // NEW
  ) => {
    setSelected([]);
    setFilteredData(data);
    setIsFilterActive(true);
    setCurrentDateRange(
      startDate && endDate ? { start: startDate, end: endDate } : null,
    );
    setCurrentCategory(category || null); // NEW state
  };

  const clearFilter = () => {
    setSelected([]);
    setFilteredData([]);
    setIsFilterActive(false);
    setCurrentDateRange(null);
  };

  // Fetch income categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getSavingCategoriesService();
        setCategories(data);
      } catch (err) {
        toast.error("Failed to fetch income categories");
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">Savings</h1>

      <SavingForm
        onSuccess={handleRefresh}
        balanceCard={<BalanceCard refreshTrigger={refreshTrigger} />}
      />

      <section aria-label="Savings charts" className="grid gap-4 xl:grid-cols-2">
        <SavingLineChart refreshTrigger={refreshTrigger} />
        <SavingBarChart refreshTrigger={refreshTrigger} />
      </section>

      <section aria-labelledby="saving-history-heading" className="space-y-3">
        <h2 id="saving-history-heading" className="text-lg font-bold tracking-tight text-[#082c28] dark:text-white">Savings history</h2>
        <SavingTransferForm
          selected={selected}
          onSuccess={handleRefresh}
          renderFilters={(action) => (
            <DateFilter
              action={action}
              fetchService={getSavingByDateRangeService}
              onFilter={handleFilter}
              categories={categories}
              categoryKey="saving_category"
              onDownloadPDF={() => {
                const data = isFilterActive ? filteredData : allData;

                if (data.length === 0) {
                  toast.warning(
                    "No data to download. Please apply filters or wait for data to load.",
                  );
                  return;
                }

                downloadService.downloadPDF(
                  data.map((row) => ({
                    ...row,
                    add_saving: row.is_transfer ? -Number(row.savings_deduction ?? row.add_saving) : row.add_saving,
                    transferred: row.is_transfer ? row.add_saving : null,
                    remarks: row.remarks || row.saving_category,
                  })),
                  [
                    { header: "ID", field: "id" },
                    { header: "Saving", field: "add_saving" },
                    { header: "Transferred to Balance", field: "transferred" },
                    { header: "Category", field: "saving_category" },
                    { header: "Remarks", field: "remarks" },
                    { header: "Total Saving", field: "total_saving" },
                    { header: "Date", field: "created_date" },
                  ],
                  "Saving_Report",
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
                  data.map((row) => ({
                    ...row,
                    add_saving: row.is_transfer ? -Number(row.savings_deduction ?? row.add_saving) : row.add_saving,
                    transferred: row.is_transfer ? row.add_saving : null,
                    remarks: row.remarks || row.saving_category,
                  })),
                  [
                    { header: "ID", field: "id" },
                    { header: "Saving", field: "add_saving" },
                    { header: "Transferred to Balance", field: "transferred" },
                    { header: "Category", field: "saving_category" },
                    { header: "Remarks", field: "remarks" },
                    { header: "Total Saving", field: "total_saving" },
                    { header: "Date", field: "created_date" },
                  ],
                  "Saving_Report",
                );
              }}
            />
          )}
        />

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

        <SavingTable
          refreshTrigger={refreshTrigger}
          filteredData={isFilterActive ? filteredData : null}
          onSuccess={handleRefresh}
          onDataLoad={setAllData}
          selectedIds={selected.map((row) => row.id)}
          onSelect={(row, checked) =>
            setSelected((rows) => checked ? [...rows, row] : rows.filter((item) => item.id !== row.id))
          }
        />
      </section>
    </main>
  );
}

export default Saving;
