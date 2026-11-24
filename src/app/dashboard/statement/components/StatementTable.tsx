"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import {
  StatementEntry,
  GroupedStatement,
  CurrencyInfo,
} from "@/app/types/statementType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface StatementTableProps {
  data: StatementEntry[];
  currency: CurrencyInfo;
  openingBalance: number;
  closingBalance: number;
}

export default function StatementTable({
  data,
  currency,
  openingBalance,
  closingBalance,
}: StatementTableProps) {
  const { isVisible } = useBalanceVisibility();

  // Group transactions by date
  const groupByDate = (entries: StatementEntry[]): GroupedStatement[] => {
    const grouped: { [key: string]: StatementEntry[] } = {};

    entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });

    // Convert to array and calculate opening/closing balances for each date
    const result: GroupedStatement[] = [];
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    sortedDates.forEach((date) => {
      const transactions = grouped[date];
      const opening =
        transactions[0]?.balance -
        (transactions[0]?.credit || 0) +
        (transactions[0]?.debit || 0);
      const closing = transactions[transactions.length - 1]?.balance;

      result.push({
        date,
        opening_balance: opening,
        closing_balance: closing,
        transactions,
      });
    });

    return result;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return "—";
    return maskAmount(amount, isVisible, currency.symbol);
  };

  const groupedData = groupByDate(data);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden xl:block">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Currency Info Header */}
            <div className="border-b border-white/10 bg-[#082c28] px-6 py-5 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Account Statement</h2>
                  <p className="mt-1 text-sm text-teal-100/80">
                    Currency: {currency.currency} ({currency.symbol}) -{" "}
                    {currency.country}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-teal-100/80">Opening Balance</p>
                  <p className="text-2xl font-bold tracking-tight tabular-nums">
                    {formatAmount(openingBalance)}
                  </p>
                </div>
              </div>
            </div>

            <Table className="min-w-[720px] tabular-nums">
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableHeadCell className="text-sm font-semibold">
                    Date
                  </TableHeadCell>
                  <TableHeadCell className="text-sm font-semibold">
                    Particulars
                  </TableHeadCell>
                  <TableHeadCell className="text-sm font-semibold text-right">
                    Credit (+)
                  </TableHeadCell>
                  <TableHeadCell className="text-sm font-semibold text-right">
                    Debit (−)
                  </TableHeadCell>
                  <TableHeadCell className="text-sm font-semibold text-right">
                    Balance
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center font-medium text-gray-500 py-8"
                    >
                      No transactions found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedData.map((group, groupIndex) => (
                    <React.Fragment key={`group-${group.date}-${groupIndex}`}>
                      {/* Date Header Row */}
                      <TableRow className="border-y border-slate-200 bg-slate-100 text-[#082c28]">
                        <TableCell colSpan={5} className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white text-[#056455]">
                              <CalendarDays className="size-4" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-semibold">
                              {formatDate(group.date)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Opening Balance Row */}
                      <TableRow className="bg-teal-50/55">
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(group.date)}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          Opening Balance
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-bold text-green-700">
                          {formatAmount(group.opening_balance)}
                        </TableCell>
                      </TableRow>

                      {/* Transaction Rows */}
                      {group.transactions.map((entry, index) => (
                        <TableRow
                          key={`${entry.id}-${index}`}
                          className="bg-white hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {entry.description}
                              </span>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  entry.type.toLowerCase() === "income"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {entry.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {entry.credit > 0
                              ? formatAmount(entry.credit)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {entry.debit > 0 ? formatAmount(entry.debit) : "—"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              entry.balance >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {entry.type.toLowerCase() === "expense" &&
                            entry.balance !== 0
                              ? "- "
                              : ""}
                            {formatAmount(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Closing Balance Row */}
                      <TableRow className="border-t border-amber-100 bg-amber-50/70">
                        <TableCell className="text-sm text-gray-600"></TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          Closing Balance
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-bold text-yellow-700">
                          {formatAmount(group.closing_balance)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Footer with Final Closing Balance */}
            {data.length > 0 && (
              <div className="bg-linear-to-r from-[#034e43] to-[#056455] text-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-teal-50">
                      Final Closing Balance
                    </p>
                    <p className="text-xs text-teal-100 mt-1">
                      As of{" "}
                      {formatDate(
                        groupedData[groupedData.length - 1]?.date ||
                          new Date().toISOString(),
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {formatAmount(closingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 xl:hidden">
        {/* Currency Info Card */}
        <div className="rounded-2xl bg-[#082c28] p-4 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Account Statement</h2>
              <p className="text-xs text-teal-100/80 mt-1">
                {currency.currency} ({currency.symbol})
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-teal-100/80">Opening Balance</p>
              <p className="text-xl font-bold tabular-nums">
                {formatAmount(openingBalance)}
              </p>
            </div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center font-medium text-gray-500 py-8 bg-white rounded-lg shadow-sm">
            No transactions found for the selected period
          </div>
        ) : (
          groupedData.map((group, groupIndex) => (
            <div key={`mobile-group-${group.date}`} className="space-y-3">
              {/* Date Header */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-5 shrink-0 text-[#056455]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {formatDate(group.date)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Opening: {formatAmount(group.opening_balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              {group.transactions.map((entry, index) => (
                <div
                  key={`mobile-${entry.id}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  {/* Type Badge and Description */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {entry.description}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            entry.type.toLowerCase() === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credit/Debit and Balance */}
                  <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 tabular-nums min-[400px]:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Credit</p>
                      <p className="text-sm font-bold text-green-600">
                        {entry.credit > 0 ? formatAmount(entry.credit) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Debit</p>
                      <p className="text-sm font-bold text-red-600">
                        {entry.debit > 0 ? formatAmount(entry.debit) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Balance</p>
                      <p
                        className={`text-sm font-bold ${
                          entry.balance >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {entry.type.toLowerCase() === "expense" &&
                        entry.balance !== 0
                          ? "- "
                          : ""}
                        {formatAmount(entry.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Closing Balance */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    Closing Balance
                  </span>
                  <span className="text-base font-bold text-yellow-700">
                    {formatAmount(group.closing_balance)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Final Closing Balance Card */}
        {data.length > 0 && (
          <div className="bg-linear-to-r from-[#034e43] to-[#056455] rounded-2xl p-4 text-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-teal-50">Final Closing Balance</p>
                <p className="text-xs text-teal-100 mt-1">
                  As of{" "}
                  {formatDate(
                    groupedData[groupedData.length - 1]?.date ||
                      new Date().toISOString(),
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatAmount(closingBalance)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
