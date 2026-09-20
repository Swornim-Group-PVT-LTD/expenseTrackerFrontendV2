"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchInput from "@/app/components/SearchInput";

import { addExpenseService } from "@/app/services/expenseService";
import { getTotalExpenseService } from "@/app/services/expenseService";
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
  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);

  // Optional file uploads
  const [uploadReceipt, setUploadReceipt] = useState<File | null>(null);
  const [uploadDocs, setUploadDocs] = useState<File[]>([]);

  const { isVisible } = useBalanceVisibility();

  // ============================================================
  // 1️⃣ Fetch currency symbol from Balance API
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
  // 2️⃣ Fetch expense categories
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
  // 3️⃣ Fetch Total Expense
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
  // 4️⃣ Upload Receipt - Single Image
  // ============================================================
  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUploadReceipt(null);
      return;
    }

    // Receipt accepts image only
    if (!file.type.startsWith("image/")) {
      toast.error("Receipt must be an image file.");
      event.target.value = "";
      setUploadReceipt(null);
      return;
    }

    setUploadReceipt(file);
  };

  // ============================================================
  // 5️⃣ Upload Documents - Multiple Images/PDF
  // ============================================================
  const handleDocumentsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setUploadDocs([]);
      return;
    }

    // Allow images and PDF
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
  // 6️⃣ Add Expense
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

      // ========================================================
      // FormData for multipart/form-data
      // ========================================================
      const formData = new FormData();

      formData.append("add_expenses", String(amount));
      formData.append("expense_category", remarks);

      // Optional single receipt
      if (uploadReceipt) {
        formData.append("upload_receipt", uploadReceipt);
      }

      // Optional multiple documents
      uploadDocs.forEach((file) => {
        formData.append("upload_doc[]", file);
      });

      await addExpenseService(formData);

      toast.success(`Expense of ${currency}${amount} added successfully.`);

      // Reset existing fields
      setAmount("");
      setRemarks("");

      // Reset upload fields
      setUploadReceipt(null);
      setUploadDocs([]);

      // Reset file input elements
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
    <div className="col-span-full lg:col-span-3 h-fit">
      <div className="bg-white rounded-md p-4 w-full h-full flex flex-col gap-4">
        {/* ======================================================
            Total Expense Display
        ====================================================== */}
        <div className="mb-4 p-3 rounded-lg bg-[#ff4d4d] border border-[#E53E3E]/30 flex items-center justify-between">
          <span className="text-md font-semibold text-white">
            Total Expense
          </span>

          <span className="text-xl font-bold text-white">
            {maskAmount(totalExpense, isVisible, currency)}
          </span>
        </div>

        {/* ======================================================
            Input Section
        ====================================================== */}
        <div className="flex flex-col gap-4">
          {/* Amount + Category + Submit */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-stretch sm:items-center">
            {/* Amount */}
            <div className="relative w-full">
              <div
                className="flex items-center h-12 border border-[#574A4A]/50 rounded
                focus-within:border-[#FFA726] px-3 gap-2"
              >
                <span className="text-md font-bold text-[#716A6A] select-none">
                  {currency}
                </span>

                <input
                  type="number"
                  placeholder="Enter Amount"
                  className="flex-1 h-full bg-transparent text-md font-bold text-[#716A6A]
                  outline-none border-none
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {/* Category */}
            <SearchInput
              options={categories.map((cat) => ({
                id: cat.id,
                value: cat.expense_category,
              }))}
              value={remarks ?? ""}
              onChange={setRemarks}
              placeholder="Type expense category..."
              className="w-full sm:w-80 text-gray-700"
            />

            {/* Submit */}
            <button
              onClick={handleAddExpense}
              disabled={loading}
              className={`bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-white font-bold
              text-md px-8 h-12 min-h-[48px] rounded transition-colors
              w-full sm:w-auto cursor-pointer ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Add"}
            </button>
          </div>

          {/* ====================================================
              File Upload Section
          ==================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Receipt */}
            <div>
              <label
                htmlFor="upload_receipt"
                className="block text-sm font-semibold text-[#574A4A] mb-2"
              >
                Upload Receipt
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Optional - Image only)
                </span>
              </label>

              <input
                id="upload_receipt"
                type="file"
                accept="image/*"
                onChange={handleReceiptChange}
                className="block w-full text-sm text-gray-600
                border border-gray-300 rounded-lg cursor-pointer
                bg-white
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-l-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-gray-100 file:text-gray-700
                hover:file:bg-gray-200"
              />

              {uploadReceipt && (
                <p className="mt-1 text-xs text-gray-500 truncate">
                  Selected: {uploadReceipt.name}
                </p>
              )}
            </div>

            {/* Upload Documents */}
            <div>
              <label
                htmlFor="upload_doc"
                className="block text-sm font-semibold text-[#574A4A] mb-2"
              >
                Upload Documents
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Optional - Multiple images/PDF)
                </span>
              </label>

              <input
                id="upload_doc"
                type="file"
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={handleDocumentsChange}
                className="block w-full text-sm text-gray-600
                border border-gray-300 rounded-lg cursor-pointer
                bg-white
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-l-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-gray-100 file:text-gray-700
                hover:file:bg-gray-200"
              />

              {uploadDocs.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {uploadDocs.length} file
                  {uploadDocs.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
