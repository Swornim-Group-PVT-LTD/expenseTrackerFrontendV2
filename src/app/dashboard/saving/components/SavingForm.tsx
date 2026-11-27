"use client";

import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
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
  balanceCard: React.ReactNode;
}

const SavingForm = ({ onSuccess, balanceCard }: SavingFormProps) => {
  const { t } = useTranslation();
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
        toast.error(t("Failed to fetch saving categories"));
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
      toast.error(t("Please enter a valid saving amount"));
      return;
    }

    // Validate category
    const categoryExists = categories.some(
      (cat) => cat.saving_category.toLowerCase() === remarks.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error(t("Please select a valid category from the list"));
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
      toast.error(error.message || t("Failed to add saving"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)]">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {balanceCard}
        <div
          className="
            rounded-2xl
            bg-gradient-to-r
            from-[#22C55E]
            to-[#44EEAA]
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">{t("Total Saving")}</p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 break-words tabular-nums">
                {maskAmount(totalSaving, isVisible, currency)}
              </p>
            </div>

            {/* Saving Icon */}
            <div
              className="
                w-12
                shrink-0
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

      </div>

      <section aria-labelledby="add-saving-heading" className="@container min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="add-saving-heading" className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">{t("Add saving")}</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 @min-[34rem]:flex-row @min-[34rem]:flex-wrap @min-[34rem]:items-end">
            {/* AMOUNT */}
            <div className="flex-1 min-w-0">
              <label className="block mb-2 text-sm font-semibold text-[#374151]">
                {t("Amount")}
              </label>

              <div
                className="
                  flex items-center h-12 rounded-xl
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
                  placeholder={t("Enter saving amount")}
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
                {t("Saving Category")}
              </label>

              <SearchInput
                options={categories.map((cat) => ({
                  id: cat.id,
                  value: cat.saving_category,
                }))}
                value={remarks}
                onChange={setRemarks}
                placeholder={t("Search saving category...")}
                className="w-full h-12 text-gray-800"
              />
            </div>

            {/* DEDUCT FROM BALANCE */}
            <div className="shrink-0">
              <label
                className="
                  flex items-center justify-between gap-4
                  h-12 rounded-xl border border-gray-100 bg-gray-50 px-4
                  cursor-pointer
                "
              >
                <span className="text-sm font-semibold text-[#374151] whitespace-nowrap">
                  {t("Deduct From Balance")}
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
              h-12
              rounded-xl
              bg-[#056455]
              hover:bg-[#034e43]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#056455]
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
              t("Saving...")
            ) : (
              <>
                <span>{t("Add Saving")}</span>
                <ArrowRight className="size-5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SavingForm;
