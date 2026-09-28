"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import { AddInvestmentPayload } from "@/app/types/investmentType";
import {
  addInvestmentService,
  getTotalInvestmentService,
} from "@/app/services/investmentService";

import { getBalancesService } from "@/app/services/balanceService";
import { BalanceResponse } from "@/app/types/balanceType";

import { getInvestmentCategoriesService } from "@/app/services/catalogueServices/investmentCatalogueService";
import { InvestmentCategoryResponse } from "@/app/types/catalolgueType/investmentCatalogueType";

import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface InvestmentFormProps {
  onSuccess?: () => void;
}

const InvestmentForm = ({ onSuccess }: InvestmentFormProps) => {
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<InvestmentCategoryResponse[]>(
    [],
  );

  const [totalInvestment, setTotalInvestment] = useState<number>(0);

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
  // 2. Fetch investment categories
  // ============================================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getInvestmentCategoriesService();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch investment categories:", err);
        toast.error("Failed to fetch investment categories");
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // 3. Fetch total investment
  // ============================================================
  const loadTotalInvestment = async () => {
    try {
      const total = await getTotalInvestmentService();
      setTotalInvestment(total);
    } catch (error) {
      console.error("Failed to fetch total investment:", error);
      setTotalInvestment(0);
    }
  };

  useEffect(() => {
    loadTotalInvestment();
  }, []);

  // ============================================================
  // 4. Add investment
  // ============================================================
  const handleAddInvestment = async () => {
    // Validate amount
    if (amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    // Validate category
    const categoryExists = categories.some(
      (cat) => cat.investment_category.toLowerCase() === category.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid category from the list");
      return;
    }

    try {
      setLoading(true);

      const payload: AddInvestmentPayload = {
        add_investment: Number(amount),
        investment_category: category,
      };

      await addInvestmentService(payload);

      toast.success(`Investment of ${currency}${amount} added successfully.`);

      // Reset
      setAmount("");
      setCategory("");

      onSuccess && onSuccess();

      loadTotalInvestment();
    } catch (error: any) {
      toast.error(error.message || "Failed to add investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-full lg:col-span-3 h-fit lg:pb-0">
      <div className="bg-white rounded-2xl p-4 sm:p-5 w-full shadow-sm">
        {/* =====================================================
            TOTAL INVESTMENT
        ====================================================== */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-r
            from-[#FF9F00]
            to-[#FFB52E]
            p-5
            mb-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                Total Investment
              </p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {maskAmount(totalInvestment, isVisible, currency)}
              </p>
            </div>

            {/* Investment Icon */}
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
              AMOUNT + CATEGORY (single row)
          ==================================================== */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* AMOUNT */}
            <div className="flex-1 min-w-0">
              <label className="block mb-2 text-sm font-semibold text-[#374151]">
                Amount
              </label>

              <div
                className="
                  flex items-center h-[56px] rounded-xl
                  border border-gray-200 bg-gray-50 px-4
                  transition-all
                  focus-within:border-[#FFAA00]
                  focus-within:bg-white
                  focus-within:ring-4
                  focus-within:ring-[#FFAA00]/10
                "
              >
                <span className="text-lg font-bold text-gray-500 mr-3 select-none">
                  {currency}
                </span>

                <input
                  type="number"
                  placeholder="Enter investment amount"
                  className="
                    flex-1 min-w-0 h-full bg-transparent outline-none border-none
                    text-base font-semibold text-gray-800 placeholder:text-gray-400
                    [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                  "
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {/* INVESTMENT CATEGORY */}
            <div className="flex-1 min-w-0">
              <label className="block mb-2 text-sm font-semibold text-[#374151]">
                Investment Category
              </label>

              <SearchInput
                options={categories.map((cat) => ({
                  id: cat.id,
                  value: cat.investment_category,
                }))}
                value={category}
                onChange={setCategory}
                placeholder="Search investment category..."
                className="w-full h-[56px] text-gray-800"
              />
            </div>
          </div>

          {/* ===================================================
              DIVIDER
          ==================================================== */}
          <div className="border-t border-gray-100 pt-1" />

          {/* ===================================================
              ADD INVESTMENT
          ==================================================== */}
          <button
            onClick={handleAddInvestment}
            disabled={loading}
            className={`
              w-full
              h-[56px]
              rounded-xl
              bg-[#FFAA00]
              hover:bg-[#E99A00]
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
              ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <span>Add Investment</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentForm;
