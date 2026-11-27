"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

import InvestmentForm from "./components/InvestmentForm";
import BalanceCard from "@/app/components/BalanceCard";
import InvestmentLineChart from "./components/InvestmentLineChart";
import DateFilter from "@/app/components/DateFilter";
import InvestmentTable from "./components/InvestmentTable";
import InvestmentBarChart from "./components/InvestmentBarChart";

import { toast } from "react-toastify";
import { getInvestmentCategoriesService } from "@/app/services/catalogueServices/investmentCatalogueService";
import { InvestmentCategoryResponse } from "@/app/types/catalolgueType/investmentCatalogueType";
import { getInvestmentByDateRangeService } from "@/app/services/investmentService";
import { InvestmentResponse } from "@/app/types/investmentType";
import { downloadService } from "@/app/services/downloadService";

function Investment() {
  const { t } = useTranslation();
  const [filteredData, setFilteredData] = useState<InvestmentResponse[]>([]);
  const [allData, setAllData] = useState<InvestmentResponse[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<InvestmentCategoryResponse[]>(
    [],
  );

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
    setRefreshTrigger((prev) => prev + 1);
    if (isFilterActive) {
      try {
        const response = await getInvestmentByDateRangeService(
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
    data: InvestmentResponse[],
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getInvestmentCategoriesService();
        setCategories(data);
      } catch (err) {
        toast.error(t("Failed to fetch investment categories"));
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">{t("Investments")}</h1>

      <InvestmentForm
        onSuccess={handleRefresh}
        balanceCard={<BalanceCard refreshTrigger={refreshTrigger} />}
      />

      <section aria-label={t("Investments charts")} className="grid gap-4 xl:grid-cols-2">
        <InvestmentLineChart refreshTrigger={refreshTrigger} />
        <InvestmentBarChart refreshTrigger={refreshTrigger} />
      </section>

      <section aria-labelledby="investment-history-heading" className="space-y-3">
        <h2 id="investment-history-heading" className="text-lg font-bold tracking-tight text-[#082c28] dark:text-white">{t("Investments history")}</h2>
        <DateFilter
          fetchService={getInvestmentByDateRangeService}
          onFilter={handleFilter}
          categories={categories}
          categoryKey="investment_category"
          exportColor="#996308"
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
                { header: "Investment", field: "add_investment" },
                { header: "Category", field: "investment_category" },
                { header: "Total Investment", field: "total_investment" },
                { header: "Date", field: "created_date" },
              ],
              "Investment_Report",
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
                { header: t("Investment"), field: "add_investment" },
                { header: t("Category"), field: "investment_category" },
                { header: t("Total Investment"), field: "total_investment" },
                { header: t("Date"), field: "created_date" },
              ],
              "Investment_Report",
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

        <InvestmentTable
          refreshTrigger={refreshTrigger}
          filteredData={isFilterActive ? filteredData : null}
          onSuccess={handleRefresh}
          onDataLoad={setAllData}
        />
      </section>
    </main>
  );
}

export default Investment;
