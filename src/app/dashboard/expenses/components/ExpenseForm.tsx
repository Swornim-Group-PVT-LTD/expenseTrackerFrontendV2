"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import {
  addExpenseService,
  getTotalExpenseService,
} from "@/app/services/expenseService";

import { getExpenseCategoriesService } from "@/app/services/catalogueServices/expenseCatalogueService";

import { ExpenseCategoryResponse } from "@/app/types/catalolgueType/expenseCatalogueType";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";
import { useCurrency } from "@/app/context/CurrencyContext";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

const ExpenseForm = ({ onSuccess }: ExpenseFormProps) => {
  const [amount, setAmount] = useState<number | "">("");

  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);

  const [totalExpense, setTotalExpense] = useState<number>(0);

  // Uploads
  const [uploadReceipt, setUploadReceipt] = useState<File | null>(null);
  const [uploadDocs, setUploadDocs] = useState<File[]>([]);

  const { isVisible } = useBalanceVisibility();

  const { currency } = useCurrency();

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
  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        !file.type.startsWith("image/") && file.type !== "application/pdf",
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
      (cat) => cat.expense_category.toLowerCase() === remarks.toLowerCase(),
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

      toast.success(`Expense of ${currency}${amount} added successfully.`);

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

  // Shared classes for the two upload tiles (h-14 to match the inputs)
  const uploadTileClass =
    "flex items-center gap-3 h-14 cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition px-3";

  // Shared classes for the label row above each field
  const labelRowClass = "flex items-center justify-between h-5 mb-2";

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
              <p className="text-sm font-medium text-white/80">Total Expense</p>

              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {maskAmount(totalExpense, isVisible, currency)}
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
                font-bold
              "
            >
              {currency ? currency : "₹"}
            </div>
          </div>
        </div>

        {/* =====================================================
            FORM
        ====================================================== */}
        <div className="space-y-5 ">
          {/* ===================================================
              FIELDS - single row (stacks on small screens)
          ==================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AMOUNT */}
            <div className="min-w-0">
              <div className={labelRowClass}>
                <label className="text-sm font-semibold text-[#374151]">
                  Amount
                </label>
              </div>

              <div
                className="
                  flex
                  items-center
                  h-14
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
                    min-w-0
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
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {/* CATEGORY */}
            <div className="min-w-0">
              <div className={labelRowClass}>
                <label className="text-sm font-semibold text-[#374151]">
                  Expense Category
                </label>
              </div>

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
                  h-14
                  text-gray-800
                "
              />
            </div>

            {/* RECEIPT UPLOAD */}
            <div className="min-w-0">
              <div className={labelRowClass}>
                <label className="text-sm font-semibold text-[#374151]">
                  Upload Receipt
                </label>

                <span className="text-xs text-gray-400">Image only</span>
              </div>

              <label htmlFor="upload_receipt" className={uploadTileClass}>
                <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                  📷
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {uploadReceipt ? "Receipt selected" : "Upload receipt"}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {uploadReceipt
                      ? uploadReceipt.name
                      : "Tap to choose an image"}
                  </p>
                </div>

                <span className="text-gray-400 text-xl">›</span>

                <input
                  id="upload_receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* DOCUMENT UPLOAD */}
            <div className="min-w-0">
              <div className={labelRowClass}>
                <label className="text-sm font-semibold text-[#374151]">
                  Upload Documents
                </label>

                <span className="text-xs text-gray-400">Images / PDF</span>
              </div>

              <label htmlFor="upload_doc" className={uploadTileClass}>
                <div className="w-9 h-9 shrink-0 rounded-lg bg-green-50 flex items-center justify-center text-lg">
                  📄
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {uploadDocs.length > 0
                      ? `${uploadDocs.length} file${
                          uploadDocs.length > 1 ? "s" : ""
                        } selected`
                      : "Upload files"}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {uploadDocs.length > 0
                      ? uploadDocs.map((file) => file.name).join(", ")
                      : "Tap to choose multiple files"}
                  </p>
                </div>

                <span className="text-gray-400 text-xl">›</span>

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
              ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
