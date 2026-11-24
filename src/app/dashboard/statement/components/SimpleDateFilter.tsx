"use client";

import { useState, useEffect } from "react";
import { Calendar, Download, FileDown, Search } from "lucide-react";
import { toast } from "react-toastify";

interface SimpleDateFilterProps {
  initialFrom?: Date;
  initialTo?: Date;
  fetchService: (from?: string, to?: string) => Promise<any>;
  onFilter: (
    data: any,
    startDate?: string,
    endDate?: string,
  ) => void | Promise<void>;
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
}

export default function SimpleDateFilter({
  initialFrom,
  initialTo,
  fetchService,
  onFilter,
  onDownloadPDF,
  onDownloadExcel,
}: SimpleDateFilterProps) {
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Today's date
  const today = new Date();
  const todayString = formatDateForInput(today);

  // From Date always today
  const [fromDate, setFromDate] = useState(todayString);

  // To Date can use prop or today
  const [toDate, setToDate] = useState(
    initialTo ? formatDateForInput(initialTo) : todayString,
  );

  const [isLoading, setIsLoading] = useState(false);

  // Auto-load today's statement
  useEffect(() => {
    handleSearch(todayString, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (
    startDate: string = fromDate,
    endDate: string = toDate,
  ) => {
    if (!startDate || !endDate) {
      toast.warning("Please select both dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("From date cannot be later than To date");
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetchService(startDate, endDate);
      await onFilter(data, startDate, endDate);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch statement");
      console.error("Error fetching statement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToday = () => {
    setFromDate(todayString);
    setToDate(todayString);

    handleSearch(todayString, todayString);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        {/* Date Inputs */}
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {/* From Date */}
          <div className="flex flex-col">
            <label
              htmlFor="fromDate"
              className="text-sm font-semibold text-gray-700 mb-2"
            >
              From Date
            </label>

            <div className="relative">
              <Calendar aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-[#056455] focus:outline-none focus:ring-2 focus:ring-[#056455]/25"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex flex-col">
            <label
              htmlFor="toDate"
              className="text-sm font-semibold text-gray-700 mb-2"
            >
              To Date
            </label>

            <div className="relative">
              <Calendar aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-[#056455] focus:outline-none focus:ring-2 focus:ring-[#056455]/25"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="search-button inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <Search className="size-4" aria-hidden="true" />
                Search
              </>
            )}
          </button>

          <button
            onClick={handleToday}
            className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#082c28] transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
          >
            Today
          </button>
        </div>
      </div>

      {/* Download Buttons */}
      {(onDownloadPDF || onDownloadExcel) && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#082c28] transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </button>
            )}

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#082c28] transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
