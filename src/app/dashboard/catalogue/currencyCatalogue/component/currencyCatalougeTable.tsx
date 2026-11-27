"use client";

import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { getCurrencyService } from "@/app/services/catalogueServices/currencyCatalogueService";

// Interface from your types
import { CurrencyResponse } from "@/app/types/currencyType";

export default function CurrencyCatalogueTable({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<CurrencyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // 🔹 Fetch Currency Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getCurrencyService();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch currency data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // 🔹 Search Filter
  const filteredData = data.filter((item) =>
    `${item.country_name} ${item.currency} ${item.symbol}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      {/* 🔍 Search Box */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          className="px-3 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder={t("Search...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop TABLE */}
      <div className="table-surface mt-4 hidden w-full overflow-x-auto lg:block">
        <table className="ledger-table min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{t("Country")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{t("Currency")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{t("Symbol")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{t("Created Date")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">{t("Updated Date")}</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <ClipLoader size={22} color="#000" />
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.country_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.currency}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.symbol}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.created_at}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.updated_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                  {t("No records found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 mt-4">
        {loading ? (
          <div className="text-center font-medium text-gray-500">
            <ClipLoader size={22} color="#000" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center font-medium text-gray-500">{t("No records found")}</div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-800">ID {item.id}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Country:")}</span>
                  <span className="font-semibold">{item.country_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Currency:")}</span>
                  <span className="font-semibold">{item.currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Symbol:")}</span>
                  <span className="font-semibold text-lg">{item.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1 pt-2 border-t">
                  <span>{t("Created:")}{" "} {item.created_at}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{t("Updated:")}{" "} {item.updated_at}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
