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
import {
  AddBalancePayload,
  BalanceResponse,
} from "../../../types/balanceType";
import { CurrencyResponse } from "@/app/types/currencyType";

export default function BalanceForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState<number | "">(40000);
  const [currencyList, setCurrencyList] = useState<CurrencyResponse[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyId, setCurrencyId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [balanceExists, setBalanceExists] = useState(false);

  // ============================================================
  // 1. Load balance & currencies
  // ============================================================
  useEffect(() => {
    const init = async () => {
      try {
        // Check existing balance
        const balance: BalanceResponse = await getBalancesService();

        if (balance) {
          setBalanceExists(true);
        } else {
          setBalanceExists(false);
        }

        // Fetch currencies
        const currencies = await getCurrencyService();
        setCurrencyList(currencies);

        // Set default currency
        if (currencies.length > 0) {
          setCurrencySymbol(currencies[0].symbol);
          setCurrencyId(currencies[0].id);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setBalanceExists(false);
      }
    };

    init();
  }, []);

  // ============================================================
  // 2. Add opening balance
  // ============================================================
  const handleAddBalance = async () => {
    // Existing balance check
    if (balanceExists) {
      Swal.fire({
        icon: "info",
        title: "Balance Already Added",
        text: "Balance has already been added. Add more through Income.",
      });

      return;
    }

    // Validate amount
    if (amount === "" || Number(amount) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid opening balance amount.",
      });

      return;
    }

    // Validate currency
    if (!currencyId) {
      Swal.fire({
        icon: "warning",
        title: "Select Currency",
        text: "Please select a currency.",
      });

      return;
    }

    try {
      setLoading(true);

      const payload: AddBalancePayload = {
        add_opening_balance: Number(amount),
        currency_id: currencyId,
      };

      await addBalanceService(payload);

      Swal.fire({
        icon: "success",
        title: "Balance Added!",
        text: `Balance of ${currencySymbol}${amount} added successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset
      setAmount("");
      setBalanceExists(true);

      onSuccess && onSuccess();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.message || "Failed to add balance",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-full lg:col-span-3 h-fit lg:pb-0">

      <div className="bg-white rounded-2xl p-4 sm:p-5 w-full shadow-sm">

        {/* =====================================================
            OPENING BALANCE HEADER
        ====================================================== */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-r
            from-[#208120]
            to-[#319331]
            p-5
            mb-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white/80">
                Opening Balance
              </p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {currencySymbol}
                {amount === "" ? "0" : Number(amount).toLocaleString()}
              </p>
            </div>

            {/* Currency */}
            <div
              className="
                w-12
                h-12
                rounded-xl
                bg-white/20
                flex
                items-center
                justify-center
                text-white
                text-xl
                font-bold
              "
            >
              {currencySymbol}
            </div>

          </div>
        </div>

        {/* =====================================================
            FORM
        ====================================================== */}
        <div className="space-y-5">

          {/* ===================================================
              CURRENCY
          ==================================================== */}
          <div>

            <label
              className="
                block
                mb-2
                text-sm
                font-semibold
                text-[#374151]
              "
            >
              Select Currency
            </label>

            <div className="relative">

              <select
                className="
                  appearance-none
                  w-full
                  h-[56px]
                  px-4
                  pr-12
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  text-base
                  font-semibold
                  text-gray-800
                  outline-none
                  cursor-pointer
                  transition-all
                  focus:border-[#64a11f]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#64a11f]/10
                "
                value={currencyId ?? ""}
                onChange={(e) => {
                  const selected = currencyList.find(
                    (item) => item.id === Number(e.target.value),
                  );

                  if (selected) {
                    setCurrencySymbol(selected.symbol);
                    setCurrencyId(selected.id);
                  }
                }}
              >
                {currencyList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.symbol}
                  </option>
                ))}
              </select>

              <ChevronDown
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-gray-500
                  pointer-events-none
                "
              />

            </div>

          </div>

          {/* ===================================================
              AMOUNT
          ==================================================== */}
          <div>

            <label
              className="
                block
                mb-2
                text-sm
                font-semibold
                text-[#374151]
              "
            >
              Amount
            </label>

            <div
              className="
                flex
                items-center
                h-[56px]
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                px-4
                transition-all
                focus-within:border-[#64a11f]
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-[#64a11f]/10
              "
            >

              <span
                className="
                  text-lg
                  font-bold
                  text-gray-500
                  mr-3
                  select-none
                "
              >
                {currencySymbol}
              </span>

              <input
                type="number"
                placeholder="Enter opening balance"
                className="
                  flex-1
                  h-full
                  bg-transparent
                  outline-none
                  border-none
                  text-base
                  font-semibold
                  text-gray-800
                  placeholder:text-gray-400
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value),
                  )
                }
              />

            </div>

          </div>

          {/* ===================================================
              INFORMATION
          ==================================================== */}
          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-gray-100
              bg-gray-50
              px-4
              py-3
            "
          >
            <div
              className="
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-lg
                bg-[#64a11f]/10
                shrink-0
              "
            >
              <Info
                className="w-4 h-4 text-[#64a11f]"
                strokeWidth={2.5}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#374151]">
                Opening Balance
              </p>

              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                This amount will be added to your total balance.
              </p>
            </div>
          </div>

          {/* ===================================================
              DIVIDER
          ==================================================== */}
          <div className="border-t border-gray-100 pt-1" />

          {/* ===================================================
              ADD BALANCE
          ==================================================== */}
          <button
            onClick={handleAddBalance}
            disabled={loading || balanceExists}
            className={`
              w-full
              h-[56px]
              rounded-xl
              bg-[#64a11f]
              hover:bg-[#579119]
              active:scale-[0.98]
              text-white
              font-bold
              text-base
              shadow-sm
              transition-all
              flex
              items-center
              justify-center
              gap-3
              ${
                loading || balanceExists
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
          >

            {loading ? (
              "Saving..."
            ) : balanceExists ? (
              "Balance Already Added"
            ) : (
              <>
                <span>Add Opening Balance</span>
                <span className="text-xl">
                  →
                </span>
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
}