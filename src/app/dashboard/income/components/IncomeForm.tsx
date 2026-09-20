"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import { AddIncomePayload } from "@/app/types/incomeType";
import {
  addIncomeService,
  getTotalIncomeService,
} from "@/app/services/incomeService";

import { getIncomeCategoriesService } from "@/app/services/catalogueServices/incomeCatalogueService";
import { getBalancesService } from "@/app/services/balanceService";

import { IncomeCategoryResponse } from "@/app/types/catalolgueType/incomeCatalogueType";
import { BalanceResponse } from "@/app/types/balanceType";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface IncomeFormProps {
  onSuccess?: () => void;
}

const IncomeForm = ({ onSuccess }: IncomeFormProps) => {
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<
    IncomeCategoryResponse[]
  >([]);

  const [totalIncome, setTotalIncome] = useState<number>(0);

  const { isVisible } = useBalanceVisibility();

  // ============================================================
  // 1. Fetch currency symbol
  // ============================================================
  const loadCurrencySymbol = async () => {
    try {
      const balance: BalanceResponse = await getBalancesService();

      if (balance?.currency?.symbol) {
        setCurrency(balance.currency.symbol);
      }
    } catch (error) {
      console.error("Failed to load currency symbol:", error);
      setCurrency("$");
    }
  };

  useEffect(() => {
    loadCurrencySymbol();
  }, []);

  // ============================================================
  // 2. Fetch income categories
  // ============================================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getIncomeCategoriesService();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch income categories:", err);
        toast.error("Failed to fetch income categories");
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // 3. Fetch total income
  // ============================================================
  const loadTotalIncome = async () => {
    try {
      const total = await getTotalIncomeService();
      setTotalIncome(total);
    } catch (error) {
      console.error("Failed to fetch total income:", error);
      setTotalIncome(0);
    }
  };

  useEffect(() => {
    loadTotalIncome();
  }, []);

  // ============================================================
  // 4. Add income
  // ============================================================
  const handleAddIncome = async () => {
    // Validate amount
    if (amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid income amount");
      return;
    }

    // Validate category
    const categoryExists = categories.some(
      (cat) =>
        cat.income_category.toLowerCase() ===
        remarks.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid category from the list");
      return;
    }

    try {
      setLoading(true);

      const payload: AddIncomePayload = {
        add_income: Number(amount),
        income_category: remarks,
      };

      await addIncomeService(payload);

      toast.success(
        `Income of ${currency}${amount} added successfully.`,
      );

      // Reset
      setAmount("");
      setRemarks("");

      onSuccess && onSuccess();

      loadTotalIncome();
    } catch (error: any) {
      toast.error(error.message || "Failed to add income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-full lg:col-span-3 h-fit lg:pb-0">

      <div className="bg-white rounded-2xl p-4 sm:p-5 w-full shadow-sm">

        {/* =====================================================
            TOTAL INCOME
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
                Total Income
              </p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {maskAmount(
                  totalIncome,
                  isVisible,
                  currency,
                )}
              </p>
            </div>

            {/* Income Icon */}
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
              {currency}
            </div>

          </div>
        </div>


        {/* =====================================================
            FORM
        ====================================================== */}
        <div className="space-y-5">

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
                {currency}
              </span>

              <input
                type="number"
                placeholder="Enter income amount"
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
              INCOME CATEGORY
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
              Income Category
            </label>

            <SearchInput
              options={categories.map((cat) => ({
                id: cat.id,
                value: cat.income_category,
              }))}
              value={remarks}
              onChange={setRemarks}
              placeholder="Search income category..."
              className="
                w-full
                h-[56px]
                text-gray-800
              "
            />

          </div>


          {/* ===================================================
              DIVIDER
          ==================================================== */}
          <div className="border-t border-gray-100 pt-1" />


          {/* ===================================================
              ADD INCOME
          ==================================================== */}
          <button
            onClick={handleAddIncome}
            disabled={loading}
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
                loading
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
          >

            {loading ? (
              "Saving..."
            ) : (
              <>
                <span>Add Income</span>
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
};

export default IncomeForm;