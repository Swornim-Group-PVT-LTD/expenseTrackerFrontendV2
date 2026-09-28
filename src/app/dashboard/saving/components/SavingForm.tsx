"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import { AddSavingPayload } from "@/app/types/savingType";
import {
  addSavingService,
  getTotalSavingService,
} from "@/app/services/savingService";

import { getSavingCategoriesService } from "@/app/services/catalogueServices/savingCatalogueService";
import { SavingCategoryResponse } from "@/app/types/catalolgueType/savingCatalogueType";

import { getBalancesService } from "@/app/services/balanceService";
import { BalanceResponse } from "@/app/types/balanceType";

import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface SavingFormProps {
  onSuccess?: () => void;
}

const SavingForm = ({ onSuccess }: SavingFormProps) => {
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [deductBalance, setDeductBalance] = useState(false);

  const [categories, setCategories] = useState<SavingCategoryResponse[]>([]);
  const [totalSaving, setTotalSaving] = useState<number>(0);

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
  // 2. Fetch saving categories
  // ============================================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getSavingCategoriesService();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch saving categories:", err);
        toast.error("Failed to fetch saving categories");
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // 3. Fetch total saving
  // ============================================================
  const loadTotalSaving = async () => {
    try {
      const total = await getTotalSavingService();
      setTotalSaving(total);
    } catch (error) {
      console.error("Failed to fetch total saving:", error);
      setTotalSaving(0);
    }
  };

  useEffect(() => {
    loadTotalSaving();
  }, []);

  // ============================================================
  // 4. Add Saving
  // ============================================================
  const handleAddSaving = async () => {
    // Validate amount
    if (amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid saving amount");
      return;
    }

    // Validate category
    const categoryExists = categories.some(
      (cat) => cat.saving_category.toLowerCase() === remarks.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid category from the list");
      return;
    }

    try {
      setLoading(true);

      const payload: AddSavingPayload = {
        add_saving: Number(amount),
        saving_category: remarks,
        want_to_deduct_from_balance: deductBalance,
      };

      await addSavingService(payload);

      toast.success(
        `Saving of ${currency}${amount} added successfully.` +
          (deductBalance ? " (deducted from balance)" : ""),
      );

      // Reset
      setAmount("");
      setRemarks("");
      setDeductBalance(false);

      onSuccess && onSuccess();

      loadTotalSaving();
    } catch (error: any) {
      toast.error(error.message || "Failed to add saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-full lg:col-span-3 h-fit lg:pb-0">
      <div className="bg-white rounded-2xl p-4 sm:p-5 w-full shadow-sm">
        {/* =====================================================
            TOTAL SAVING
        ====================================================== */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-r
            from-[#22C55E]
            to-[#44EEAA]
            p-5
            mb-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Total Saving</p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {maskAmount(totalSaving, isVisible, currency)}
              </p>
            </div>

            {/* Saving Icon */}
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
              AMOUNT + CATEGORY + DEDUCT (single row)
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
                  focus-within:border-[#44EEAA]
                  focus-within:bg-white
                  focus-within:ring-4
                  focus-within:ring-[#44EEAA]/10
                "
              >
                <span className="text-lg font-bold text-gray-500 mr-3 select-none">
                  {currency}
                </span>

                <input
                  type="number"
                  placeholder="Enter saving amount"
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

            {/* SAVING CATEGORY */}
            <div className="flex-1 min-w-0">
              <label className="block mb-2 text-sm font-semibold text-[#374151]">
                Saving Category
              </label>

              <SearchInput
                options={categories.map((cat) => ({
                  id: cat.id,
                  value: cat.saving_category,
                }))}
                value={remarks}
                onChange={setRemarks}
                placeholder="Search saving category..."
                className="w-full h-[56px] text-gray-800"
              />
            </div>

            {/* DEDUCT FROM BALANCE */}
            <div className="shrink-0">
              <label
                className="
                  flex items-center justify-between gap-4
                  h-[56px] rounded-xl border border-gray-100 bg-gray-50 px-4
                  cursor-pointer
                "
              >
                <span className="text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Deduct From Balance
                </span>

                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={deductBalance}
                    onChange={(e) => setDeductBalance(e.target.checked)}
                    className="sr-only peer"
                  />

                  <div
                    className="
                      w-11 h-6 bg-gray-300 rounded-full peer
                      peer-checked:bg-[#44EEAA]
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                      after:bg-white after:rounded-full after:h-5 after:w-5
                      after:transition-all peer-checked:after:translate-x-full
                    "
                  />
                </div>
              </label>
            </div>
          </div>

          {/* ===================================================
              DIVIDER
          ==================================================== */}
          <div className="border-t border-gray-100 pt-1" />

          {/* ===================================================
              ADD SAVING
          ==================================================== */}
          <button
            onClick={handleAddSaving}
            disabled={loading}
            className={`
              w-full
              h-[56px]
              rounded-xl
              bg-[#22C55E]
              hover:bg-[#44EEAA]
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
                <span>Add Saving</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingForm;
