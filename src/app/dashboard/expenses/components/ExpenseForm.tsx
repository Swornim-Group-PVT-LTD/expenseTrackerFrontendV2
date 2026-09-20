"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import {
  addExpenseService,
  getTotalExpenseService,
} from "@/app/services/expenseService";

import { getExpenseCategoriesService } from "@/app/services/catalogueServices/expenseCatalogueService";
import { getBalancesService } from "@/app/services/balanceService";

import { ExpenseCategoryResponse } from "@/app/types/catalolgueType/expenseCatalogueType";
import { BalanceResponse } from "@/app/types/balanceType";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

const ExpenseForm = ({ onSuccess }: ExpenseFormProps) => {
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<
    ExpenseCategoryResponse[]
  >([]);

  const [totalExpense, setTotalExpense] = useState<number>(0);

  // Uploads
  const [uploadReceipt, setUploadReceipt] = useState<File | null>(null);
  const [uploadDocs, setUploadDocs] = useState<File[]>([]);

  const { isVisible } = useBalanceVisibility();

  // ============================================================
  // Fetch currency
  // ============================================================
  const loadCurrencySymbol = async () => {
    try {
      const balance: BalanceResponse = await getBalancesService();

      if (balance?.currency?.symbol) {
        setCurrency(balance.currency.symbol);
      }
    } catch (error) {
      console.error("Failed to load currency symbol:", error);
      setCurrency("₹");
    }
  };

  useEffect(() => {
    loadCurrencySymbol();
  }, []);

  // ============================================================
  // Fetch categories
  // ============================================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getExpenseCategoriesService();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch expense categories:", err);
        toast.error("Failed to fetch expense categories");
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // Fetch total expense
  // ============================================================
  const loadTotalExpense = async () => {
    try {
      const total = await getTotalExpenseService();
      setTotalExpense(total);
    } catch (err) {
      console.error("Failed to fetch total expense:", err);
      setTotalExpense(0);
    }
  };

  useEffect(() => {
    loadTotalExpense();
  }, []);

  // ============================================================
  // Receipt - Image only
  // ============================================================
  const handleReceiptChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUploadReceipt(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Receipt must be an image file.");
      event.target.value = "";
      setUploadReceipt(null);
      return;
    }

    setUploadReceipt(file);
  };

  // ============================================================
  // Documents - Multiple Images/PDF
  // ============================================================
  const handleDocumentsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setUploadDocs([]);
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") &&
        file.type !== "application/pdf",
    );

    if (invalidFiles.length > 0) {
      toast.error("Only image and PDF files are allowed.");
      event.target.value = "";
      setUploadDocs([]);
      return;
    }

    setUploadDocs(files);
  };

  // ============================================================
  // Add Expense
  // ============================================================
  const handleAddExpense = async () => {
    // Validate category
    const categoryExists = categories.some(
      (cat) =>
        cat.expense_category.toLowerCase() ===
        remarks.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid category from the list");
      return;
    }

    // Validate amount
    if (amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("add_expenses", String(amount));
      formData.append("expense_category", remarks);

      // Receipt
      if (uploadReceipt) {
        formData.append("upload_receipt", uploadReceipt);
      }

      // Documents
      uploadDocs.forEach((file) => {
        formData.append("upload_doc[]", file);
      });

      await addExpenseService(formData);

      toast.success(
        `Expense of ${currency}${amount} added successfully.`,
      );

      // Reset
      setAmount("");
      setRemarks("");
      setUploadReceipt(null);
      setUploadDocs([]);

      // Reset file inputs
      const receiptInput = document.getElementById(
        "upload_receipt",
      ) as HTMLInputElement | null;

      const documentInput = document.getElementById(
        "upload_doc",
      ) as HTMLInputElement | null;

      if (receiptInput) {
        receiptInput.value = "";
      }

      if (documentInput) {
        documentInput.value = "";
      }

      onSuccess && onSuccess();

      loadTotalExpense();
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-full lg:col-span-3 h-fit lg:pb-0">
      <div className="bg-white rounded-2xl p-4 sm:p-5 w-full shadow-sm">

        {/* =====================================================
            TOTAL EXPENSE
        ====================================================== */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-r
            from-[#ff4d4d]
            to-[#ff6262]
            p-5
            mb-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white/80">
                Total Expense
              </p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {maskAmount(
                  totalExpense,
                  isVisible,
                  currency,
                )}
              </p>
            </div>

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
              "
            >
              ₹
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
            <label className="block mb-2 text-sm font-semibold text-[#374151]">
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
                focus-within:border-[#FFAA00]
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-[#FFAA00]/10
              "
            >
              <span className="text-lg font-bold text-gray-500 mr-3">
                {currency}
              </span>

              <input
                type="number"
                placeholder="Enter expense amount"
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
              CATEGORY
          ==================================================== */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-[#374151]">
              Expense Category
            </label>

            <SearchInput
              options={categories.map((cat) => ({
                id: cat.id,
                value: cat.expense_category,
              }))}
              value={remarks ?? ""}
              onChange={setRemarks}
              placeholder="Search expense category..."
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
              RECEIPT UPLOAD
          ==================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-semibold text-[#374151]">
                Upload Receipt
              </label>

              <span className="text-xs text-gray-400">
                Image only
              </span>

            </div>

            <label
              htmlFor="upload_receipt"
              className="
                block
                cursor-pointer
                rounded-xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                hover:bg-gray-100
                transition
                p-4
              "
            >
              <div className="flex items-center gap-4">

                {/* Icon */}
                <div
                  className="
                    w-12
                    h-12
                    shrink-0
                    rounded-xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    text-xl
                  "
                >
                  📷
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">

                  <p className="font-semibold text-gray-800 text-sm">
                    {uploadReceipt
                      ? "Receipt selected"
                      : "Upload receipt"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {uploadReceipt
                      ? uploadReceipt.name
                      : "Tap to choose an image"}
                  </p>

                </div>

                <span className="text-gray-400 text-xl">
                  ›
                </span>

              </div>

              <input
                id="upload_receipt"
                type="file"
                accept="image/*"
                onChange={handleReceiptChange}
                className="hidden"
              />
            </label>
          </div>


          {/* ===================================================
              DOCUMENT UPLOAD
          ==================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-semibold text-[#374151]">
                Upload Documents
              </label>

              <span className="text-xs text-gray-400">
                Images / PDF
              </span>

            </div>

            <label
              htmlFor="upload_doc"
              className="
                block
                cursor-pointer
                rounded-xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                hover:bg-gray-100
                transition
                p-4
              "
            >
              <div className="flex items-center gap-4">

                {/* Icon */}
                <div
                  className="
                    w-12
                    h-12
                    shrink-0
                    rounded-xl
                    bg-green-50
                    flex
                    items-center
                    justify-center
                    text-xl
                  "
                >
                  📄
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">

                  <p className="font-semibold text-gray-800 text-sm">
                    {uploadDocs.length > 0
                      ? `${uploadDocs.length} file${
                          uploadDocs.length > 1
                            ? "s"
                            : ""
                        } selected`
                      : "Upload files"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {uploadDocs.length > 0
                      ? uploadDocs
                          .map((file) => file.name)
                          .join(", ")
                      : "Tap to choose multiple files"}
                  </p>

                </div>

                <span className="text-gray-400 text-xl">
                  ›
                </span>

              </div>

              <input
                id="upload_doc"
                type="file"
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={handleDocumentsChange}
                className="hidden"
              />
            </label>
          </div>


          {/* ===================================================
              ADD EXPENSE BUTTON
          ==================================================== */}
          <button
            onClick={handleAddExpense}
            disabled={loading}
            className={`
              w-full
              h-[56px]
              rounded-xl
              bg-[#ff4d4d]
              hover:bg-[#ff6262]
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
                <span>Add Expense</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;