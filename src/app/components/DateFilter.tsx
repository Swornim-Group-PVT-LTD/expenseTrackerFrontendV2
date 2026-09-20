"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Datepicker } from "flowbite-react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

interface DateFilterProps {
  fetchService: Function;
  onFilter: Function;
  categories: any[];
  categoryKey: string;
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
  initialFrom?: Date;
  initialTo?: Date;
}

export default function DateFilter({
  fetchService,
  onFilter,
  categories,
  categoryKey,
  onDownloadPDF,
  onDownloadExcel,
  initialFrom,
  initialTo,
}: DateFilterProps) {
  const [from, setFrom] = useState<Date | undefined>(
    initialFrom || new Date(),
  );

  const [to, setTo] = useState<Date | undefined>(
    initialTo || new Date(),
  );

  const [selectedCategory, setSelectedCategory] =
    useState<string>("");

  const [error, setError] = useState<string>("");

  const [useDateRange, setUseDateRange] =
    useState<boolean>(false);

  const formatLocalDate = (d: Date) =>
    d
      ? new Date(
          d.getTime() - d.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .split("T")[0]
      : "";

  const handleSearch = async () => {
    setError("");

    // Validate date range
    if (useDateRange && from && to && from > to) {
      setError("'From' date cannot be later than 'To' date.");
      return;
    }

    // Validate category
    if (
      selectedCategory &&
      selectedCategory.trim() !== ""
    ) {
      const categoryExists = categories.some(
        (cat) =>
          cat[categoryKey]?.toLowerCase() ===
          selectedCategory.toLowerCase(),
      );

      if (!categoryExists) {
        toast.error(
          "Please select a valid category from the list",
        );
        return;
      }
    }

    const start_date =
      useDateRange && from
        ? formatLocalDate(from)
        : undefined;

    const end_date =
      useDateRange && to
        ? formatLocalDate(to)
        : undefined;

    try {
      const response = await fetchService(
        start_date,
        end_date,
        selectedCategory || undefined,
      );

      onFilter(
        response,
        start_date,
        end_date,
        selectedCategory,
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to fetch data for the selected date range.",
      );
    }
  };

  useEffect(() => {
    if (initialFrom && initialTo) {
      handleSearch();
    }
  }, []);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ================= HEADER ================= */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFAA00]/10">
              <SlidersHorizontal
                size={20}
                className="text-[#FFAA00]"
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#2D2D2D]">
                Filter Records
              </h2>

              <p className="text-xs text-gray-500 sm:text-sm">
                Refine your data using date and category
              </p>
            </div>
          </div>

          {/* ================= EXPORT BUTTONS ================= */}
          {(onDownloadExcel || onDownloadPDF) && (
            <div className="flex items-center gap-2">
              <span className="mr-1 hidden text-xs font-medium text-gray-400 sm:block">
                Export
              </span>

              {onDownloadExcel && (
                <button
                  type="button"
                  onClick={onDownloadExcel}
                  title="Download Excel"
                  className="group flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white transition-all hover:border-green-300 hover:bg-green-50 hover:shadow-sm"
                >
                  <FileSpreadsheet
                    size={19}
                    className="text-gray-500 transition-colors group-hover:text-green-600"
                  />
                </button>
              )}

              {onDownloadPDF && (
                <button
                  type="button"
                  onClick={onDownloadPDF}
                  title="Download PDF"
                  className="group flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-sm"
                >
                  <FileText
                    size={19}
                    className="text-gray-500 transition-colors group-hover:text-red-600"
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= FILTER BODY ================= */}
      <div className="p-4 sm:p-5">
        {/* Date Range Toggle */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                useDateRange
                  ? "bg-[#FFAA00]/15 text-[#FFAA00]"
                  : "bg-white text-gray-400"
              }`}
            >
              <CalendarDays size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">
                Filter by date range
              </p>

              <p className="text-xs text-gray-400">
                {useDateRange
                  ? "Date filtering is enabled"
                  : "Search without date restrictions"}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={useDateRange}
            onClick={() =>
              setUseDateRange(!useDateRange)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
              useDateRange
                ? "bg-[#FFAA00]"
                : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                useDateRange
                  ? "translate-x-5"
                  : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* ================= FILTER CONTROLS ================= */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* FROM */}
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#716A6A]">
              <CalendarDays size={15} />
              From
            </label>

            <div
              className={`rounded-lg transition-all ${
                !useDateRange
                  ? "pointer-events-none opacity-45"
                  : ""
              }`}
            >
              <Datepicker
                value={from}
                disabled={!useDateRange}
                onChange={(date: Date | null) => {
                  setFrom(date || undefined);
                }}
              />
            </div>
          </div>

          {/* TO */}
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#716A6A]">
              <CalendarDays size={15} />
              To
            </label>

            <div
              className={`rounded-lg transition-all ${
                !useDateRange
                  ? "pointer-events-none opacity-45"
                  : ""
              }`}
            >
              <Datepicker
                value={to}
                disabled={!useDateRange}
                onChange={(date: Date | null) => {
                  setTo(date || undefined);
                }}
              />
            </div>
          </div>

          {/* CATEGORY */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-[#716A6A]">
              Category
            </label>

            <SearchInput
              options={
                categories?.map((cat) => ({
                  id: cat.id,
                  value: cat[categoryKey],
                })) || []
              }
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="All Categories"
              className="w-full"
            />
          </div>

          {/* SEARCH */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#FFAA00] px-6 text-base font-bold text-white shadow-sm transition-all hover:bg-[#FF9900] hover:shadow-md active:scale-[0.98] xl:px-8"
            >
              <Search size={19} strokeWidth={2.5} />
              Search
            </button>
          </div>
        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}