
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Info } from "lucide-react";
import Swal from "sweetalert2";

// Services
import {
  addBalanceService,
  getBalancesService,
} from "../../../services/balanceService";
import { getCurrencyService } from "@/app/services/catalogueServices/currencyCatalogueService";

// Types
import type {
  AddBalancePayload,
  BalanceResponse,
} from "../../../types/balanceType";
import type { CurrencyResponse } from "@/app/types/currencyType";

type UnknownRecord = Record<string, unknown>;

// ============================================================
// Helpers
// ============================================================

function extractCurrencies(response: unknown): CurrencyResponse[] {
  if (Array.isArray(response)) {
    return response as CurrencyResponse[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const result = response as UnknownRecord;

  if (Array.isArray(result.data)) {
    return result.data as CurrencyResponse[];
  }

  if (result.data && typeof result.data === "object") {
    const nested = result.data as UnknownRecord;

    if (Array.isArray(nested.data)) {
      return nested.data as CurrencyResponse[];
    }
  }

  if (Array.isArray(result.currencies)) {
    return result.currencies as CurrencyResponse[];
  }

  return [];
}

function hasExistingBalance(response: unknown): boolean {
  if (
    response === null ||
    response === undefined ||
    response === false
  ) {
    return false;
  }

  if (Array.isArray(response)) {
    return response.length > 0;
  }

  if (typeof response === "number") {
    return response > 0;
  }

  if (typeof response !== "object") {
    return false;
  }

  const result = response as UnknownRecord;

  // Handle common API response wrappers.
  if ("data" in result) {
    return hasExistingBalance(result.data);
  }

  if ("balance" in result) {
    return hasExistingBalance(result.balance);
  }

  if (Object.keys(result).length === 0) {
    return false;
  }

  return (
    "opening_balance" in result ||
    "add_opening_balance" in result ||
    "master_opening_balance" in result ||
    "customerid" in result
  );
}

// ============================================================
// Balance Form
// ============================================================

export default function BalanceForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState<number | "">(40000);

  const [currencyList, setCurrencyList] = useState<CurrencyResponse[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [currencyId, setCurrencyId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [checkingBalance, setCheckingBalance] = useState(true);
  const [balanceExists, setBalanceExists] = useState(false);

  // ============================================================
  // 1. Load currencies and check existing balance
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Load currencies.
      try {
        const response: unknown = await getCurrencyService();
        const currencies = extractCurrencies(response).filter(
          (item) => item && item.id !== undefined && item.id !== null,
        );

        if (isMounted) {
          setCurrencyList(currencies);

          if (currencies.length > 0) {
            setCurrencyId(currencies[0].id);
            setCurrencySymbol(currencies[0].symbol || "");
          } else {
            setCurrencyId(null);
            setCurrencySymbol("");
            console.warn("No currencies found:", response);
          }
        }
      } catch (error) {
        console.error("Error loading currencies:", error);

        if (isMounted) {
          setCurrencyList([]);
          setCurrencyId(null);
          setCurrencySymbol("");
        }
      } finally {
        if (isMounted) {
          setLoadingCurrencies(false);
        }
      }

      // Check whether the customer already has a balance.
      try {
        const balance: BalanceResponse = await getBalancesService();

        if (isMounted) {
          setBalanceExists(hasExistingBalance(balance));
        }
      } catch (error) {
        console.error("Error checking existing balance:", error);

        if (isMounted) {
          setBalanceExists(false);
        }
      } finally {
        if (isMounted) {
          setCheckingBalance(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // 2. Select currency
  // ============================================================

  const handleCurrencyChange = (value: string) => {
    const selectedCurrency = currencyList.find(
      (item) => String(item.id) === value,
    );

    if (selectedCurrency) {
      setCurrencyId(selectedCurrency.id);
      setCurrencySymbol(selectedCurrency.symbol || "");
    } else {
      setCurrencyId(null);
      setCurrencySymbol("");
    }
  };

  // ============================================================
  // 3. Add opening balance
  // ============================================================

  const handleAddBalance = async () => {
    if (balanceExists) {
      await Swal.fire({
        icon: "info",
        title: "Balance Already Added",
        text: "Your opening balance has already been added. Add more through Income.",
      });

      return;
    }

    if (
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid opening balance amount.",
      });

      return;
    }

    if (currencyId === null) {
      await Swal.fire({
        icon: "warning",
        title: "Select Currency",
        text: "Please select a currency before adding your opening balance.",
      });

      return;
    }

    try {
      setLoading(true);

      // FIX: Laravel expects "opening_balance".
      const payload: AddBalancePayload = {
        opening_balance: Number(amount),
        currency_id: currencyId,
      };

      await addBalanceService(payload);

      await Swal.fire({
        icon: "success",
        title: "Balance Added!",
        text: `Opening balance of ${currencySymbol}${Number(
          amount,
        ).toLocaleString()} added successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setAmount("");
      setBalanceExists(true);

      onSuccess?.();
    } catch (error: unknown) {
      console.error("Error adding opening balance:", error);

      let message = "Failed to add opening balance. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const response = (
          error as {
            response?: {
              data?: {
                message?: string;
                errors?: Record<string, string[]>;
              };
            };
          }
        ).response;

        const errors = response?.data?.errors;

        if (errors) {
          message = Object.values(errors).flat().join("\n");
        } else if (response?.data?.message) {
          message = response.data.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      await Swal.fire({
        icon: "error",
        title: "Failed to Add Balance",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 4. UI
  // ============================================================

  return (
    <div className="col-span-full h-fit lg:col-span-3 lg:pb-0">
      <div className="w-full rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-5">
          {/* CURRENCY */}
          <div>
            <label
              htmlFor="balance-currency"
              className="mb-2 block text-sm font-semibold text-[#374151]"
            >
              Select Currency
            </label>

            <div className="relative">
              <select
                id="balance-currency"
                className="h-[56px] w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-base font-semibold text-gray-800 outline-none transition-all focus:border-[#64a11f] focus:bg-white focus:ring-4 focus:ring-[#64a11f]/10 disabled:cursor-not-allowed disabled:opacity-60"
                value={currencyId === null ? "" : String(currencyId)}
                onChange={(event) =>
                  handleCurrencyChange(event.target.value)
                }
                disabled={
                  loadingCurrencies ||
                  currencyList.length === 0 ||
                  balanceExists ||
                  checkingBalance
                }
              >
                <option value="" disabled>
                  {loadingCurrencies
                    ? "Loading currencies..."
                    : currencyList.length === 0
                      ? "No currencies available"
                      : "Select Currency"}
                </option>

                {currencyList.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.symbol || "—"}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            </div>

            {!loadingCurrencies && currencyList.length === 0 && (
              <p className="mt-2 text-xs text-red-500">
                Unable to load currencies. Please check the currency service.
              </p>
            )}
          </div>

          {/* AMOUNT */}
          <div>
            <label
              htmlFor="opening-balance-amount"
              className="mb-2 block text-sm font-semibold text-[#374151]"
            >
              Amount
            </label>

            <div className="flex h-[56px] items-center rounded-xl border border-gray-200 bg-gray-50 px-4 transition-all focus-within:border-[#64a11f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#64a11f]/10">
              <span className="mr-3 select-none text-lg font-bold text-gray-500">
                {currencySymbol || "—"}
              </span>

              <input
                id="opening-balance-amount"
                type="number"
                min="0"
                step="any"
                placeholder="Enter opening balance"
                className="h-full flex-1 border-none bg-transparent text-base font-semibold text-gray-800 outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value === ""
                      ? ""
                      : Number(event.target.value),
                  )
                }
                disabled={balanceExists || checkingBalance}
              />
            </div>
          </div>

          {/* INFORMATION */}
          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#64a11f]/10">
              <Info
                className="h-4 w-4 text-[#64a11f]"
                strokeWidth={2.5}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151]">
                Opening Balance
              </p>

              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                This amount will be added to your total balance.
              </p>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-gray-100 pt-1" />

          {/* ADD BALANCE */}
          <button
            type="button"
            onClick={handleAddBalance}
            disabled={
              loading ||
              balanceExists ||
              checkingBalance ||
              loadingCurrencies ||
              currencyList.length === 0 ||
              currencyId === null
            }
            className={`flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-[#64a11f] text-base font-bold text-white shadow-sm transition-all hover:bg-[#579119] active:scale-[0.98] ${loading ||
                balanceExists ||
                checkingBalance ||
                loadingCurrencies ||
                currencyList.length === 0 ||
                currencyId === null
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
              }`}
          >
            {loading
              ? "Saving..."
              : checkingBalance
                ? "Checking Balance..."
                : loadingCurrencies
                  ? "Loading currencies..."
                  : balanceExists
                    ? "Balance Already Added"
                    : currencyList.length === 0 || currencyId === null
                      ? "Currencies Unavailable"
                      : (
                        <>
                          <span>Add Opening Balance</span>
                          <span className="text-xl">→</span>
                        </>
                      )}
          </button>
        </div>
      </div>
    </div>
  );
}
