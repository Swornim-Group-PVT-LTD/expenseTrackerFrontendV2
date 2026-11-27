"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "react-toastify";

import SimpleDateFilter from "./components/SimpleDateFilter";
import StatementTable from "./components/StatementTable";
import { getStatementByDateRangeService } from "@/app/services/statementService";
import {
  StatementEntry,
  StatementResponse,
  CurrencyInfo,
} from "@/app/types/statementType";
import { downloadService } from "@/app/services/downloadService";

function StatementOfAccount() {
  const { t } = useTranslation();
  const [statementData, setStatementData] = useState<StatementEntry[]>([]);
  const [currency, setCurrency] = useState<CurrencyInfo>({
    country: "Nepal",
    currency: "NPR",
    symbol: "रु",
  });
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);

  const handleFilter = async (
    data: any,
    startDate?: string,
    endDate?: string,
  ) => {
    // The data parameter will be the full StatementResponse from the service
    if (data && typeof data === "object" && "data" in data) {
      const response = data as StatementResponse;
      setStatementData(response.data || []);
      setCurrency(response.currency);
      setOpeningBalance(response.opening_balance);
      setClosingBalance(response.closing_balance);
    }
  };

  // Prepare data for download (flatten the structure)
  const prepareDownloadData = () => {
    return statementData.map((entry) => ({
      date: entry.date,
      description: entry.description,
      type: entry.type,
      credit: entry.credit,
      debit: entry.debit,
      balance: entry.balance,
    }));
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] sm:text-3xl">
        {t("Statement of Account")}
      </h1>

      <SimpleDateFilter
        initialFrom={
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
        initialTo={new Date()}
        fetchService={getStatementByDateRangeService}
        onFilter={handleFilter}
        onDownloadPDF={() => {
          if (statementData.length === 0) {
            toast.warning(
              t("No data to download. Please apply filters or wait for data to load."),
            );
            return;
          }
          const downloadData = prepareDownloadData();
          downloadService.downloadPDF(
            downloadData,
            [
              { header: "Date", field: "date" },
              { header: "Description", field: "description" },
              { header: "Type", field: "type" },
              { header: "Credit", field: "credit" },
              { header: "Debit", field: "debit" },
              { header: "Balance", field: "balance" },
            ],
            "Statement_of_Account",
          );
        }}
        onDownloadExcel={() => {
          if (statementData.length === 0) {
            toast.warning(
              t("No data to download. Please apply filters or wait for data to load."),
            );
            return;
          }
          const downloadData = prepareDownloadData();
          downloadService.downloadExcel(
            downloadData,
            [
              { header: t("Date"), field: "date" },
              { header: t("Description"), field: "description" },
              { header: t("Type"), field: "type" },
              { header: t("Credit"), field: "credit" },
              { header: t("Debit"), field: "debit" },
              { header: t("Balance"), field: "balance" },
            ],
            "Statement_of_Account",
          );
        }}
      />

      <StatementTable
        data={statementData}
        currency={currency}
        openingBalance={openingBalance}
        closingBalance={closingBalance}
      />
    </div>
  );
}

export default StatementOfAccount;
