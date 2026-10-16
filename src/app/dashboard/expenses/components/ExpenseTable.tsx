
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { ClipLoader } from "react-spinners";
import {
  X,
  ReceiptText,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getExpenseService,
  deleteExpenseService,
  updateExpenseService,
} from "@/app/services/expenseService";
import { getExpenseCategoriesService } from "@/app/services/catalogueServices/expenseCatalogueService";
import SearchInput from "@/app/components/SearchInput";
import { ExpenseResponse } from "@/app/types/expenseType";
import { ExpenseCategoryResponse } from "@/app/types/catalolgueType/expenseCatalogueType";
import { maskAmount } from "@/app/utils/maskAmount";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";

interface ExpensesTableProps {
  filteredData?: ExpenseResponse[];
  isFilterActive?: boolean;
  onDataChange?: () => void;
  refreshTrigger?: number;
  onSuccess?: () => void;
  onDataLoad?: (data: ExpenseResponse[]) => void;
}

interface PreviewFile {
  url: string;
  fileName: string;
  fileType: string;
}

const THEME = {
  primary: "#14383F",
  border: "#E5E7EB",
  text: "#374151",
};

const formatAmount = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const ExpensesTable = ({
  filteredData,
  isFilterActive = false,
  onDataChange,
  refreshTrigger,
  onSuccess,
  onDataLoad,
}: ExpensesTableProps) => {
  const { isVisible } = useBalanceVisibility();

  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
  const [editingSn, setEditingSn] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("");
  const [editReceipt, setEditReceipt] = useState<File | null>(null);
  const [editDocuments, setEditDocuments] = useState<File[]>([]);
  const [openAttachment, setOpenAttachment] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const editReceiptInputRef = useRef<HTMLInputElement>(null);
  const editDocumentsInputRef = useRef<HTMLInputElement>(null);

  const dataToDisplay = isFilterActive ? filteredData ?? [] : expenses;
  const isLoading = fetching && !isFilterActive;

  const lastExpense =
    dataToDisplay.length > 0
      ? dataToDisplay[dataToDisplay.length - 1]
      : null;

  // AMOUNT FORMATTING AND VISIBILITY
  const displayAmount = (
    value: number | string | null | undefined,
  ): string => {
    if (isVisible) {
      return formatAmount(value);
    }

    return maskAmount(value, isVisible, "");
  };

  // LOAD EXPENSES
  const loadExpenses = useCallback(async () => {
    setFetching(true);

    try {
      const data = await getExpenseService();
      setExpenses(data);
      onDataLoad?.(data);
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error);
      toast.error(error?.message || "Failed to fetch expenses");
    } finally {
      setFetching(false);
    }
  }, [onDataLoad]);

  // LOAD CATEGORIES
  const loadCategories = useCallback(async () => {
    try {
      const data = await getExpenseCategoriesService();
      setCategories(data);
    } catch (error: any) {
      console.error("Failed to fetch expense categories:", error);
      toast.error(error?.message || "Failed to load expense categories");
    }
  }, []);

  useEffect(() => {
    if (!isFilterActive) {
      void loadExpenses();
    } else {
      setFetching(false);
    }
  }, [isFilterActive, loadExpenses]);

  useEffect(() => {
    if (refreshTrigger !== undefined && !isFilterActive) {
      void loadExpenses();
    }
  }, [refreshTrigger, isFilterActive, loadExpenses]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // ATTACHMENT HELPERS
  const closePreview = useCallback(() => {
    setPreviewFile(null);
    setFullScreen(false);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (previewFile) {
          closePreview();
        } else {
          setOpenAttachment(null);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [previewFile, closePreview]);

  const openPreview = (
    url: string,
    fileName: string,
    fileType: string,
  ) => {
    setOpenAttachment(null);
    setPreviewFile({ url, fileName, fileType });
    setFullScreen(false);
  };

  const isPdfFile = (file: PreviewFile) =>
    file.fileType === "application/pdf" ||
    file.fileName.toLowerCase().endsWith(".pdf");

  const isImageFile = (file: PreviewFile) =>
    file.fileType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.fileName);

  const resetFileInputs = () => {
    if (editReceiptInputRef.current) {
      editReceiptInputRef.current.value = "";
    }

    if (editDocumentsInputRef.current) {
      editDocumentsInputRef.current.value = "";
    }
  };

  // EDIT HELPERS
  const startEdit = (expense: ExpenseResponse) => {
    setEditingSn(expense.sn);
    setEditAmount(Number(expense.add_expenses));
    setEditCategory(expense.expense_category);
    setEditReceipt(null);
    setEditDocuments([]);
    setOpenAttachment(null);
    resetFileInputs();
  };

  const cancelEdit = () => {
    setEditingSn(null);
    setEditAmount("");
    setEditCategory("");
    setEditReceipt(null);
    setEditDocuments([]);
    resetFileInputs();
  };

  const handleEditReceiptChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setEditReceipt(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Receipt must be an image file.");
      event.target.value = "";
      setEditReceipt(null);
      return;
    }

    setEditReceipt(file);
  };

  const handleEditDocumentsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") &&
        file.type !== "application/pdf",
    );

    if (invalidFiles.length > 0) {
      toast.error("Only image and PDF files are allowed.");
      event.target.value = "";
      setEditDocuments([]);
      return;
    }

    setEditDocuments(files);
  };

  // SAVE EDIT
  const saveEdit = async (sn: string) => {
    if (
      editAmount === "" ||
      !Number.isFinite(Number(editAmount)) ||
      Number(editAmount) <= 0
    ) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const categoryExists = categories.some(
      (category) =>
        category.expense_category.toLowerCase() ===
        editCategory.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid expense category.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("add_expenses", String(editAmount));
      formData.append("expense_category", editCategory);

      if (editReceipt) {
        formData.append("upload_receipt", editReceipt);
      }

      editDocuments.forEach((file) => {
        formData.append("upload_doc[]", file);
      });

      await updateExpenseService(sn, formData);

      toast.success("Expense updated successfully.");
      cancelEdit();

      if (isFilterActive) {
        onDataChange?.();
      } else {
        await loadExpenses();
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to update expense:", error);
      toast.error(error?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  // DELETE EXPENSE
  const handleDelete = async (sn: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await deleteExpenseService(sn);
      toast.success("Expense deleted successfully.");

      if (isFilterActive) {
        onDataChange?.();
      } else {
        await loadExpenses();
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to delete expense:", error);
      toast.error(error?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  // CURRENCY SYMBOL: SIMPLE TEXT, NO RED HIGHLIGHT
  const renderCurrencySymbol = (
    symbol: string | null | undefined,
  ) => {
    if (!symbol) return null;

    return (
      <span className="mr-1 inline font-normal text-inherit">
        {symbol}
      </span>
    );
  };

  // TOTAL EXPENSES BAR
  const renderTotalBar = () => {
    if (isLoading || !lastExpense) return null;

    return (
      <div
        className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
        style={{
          backgroundColor: "#DC2626",
          borderColor: "#DC2626",
          color: "#FFFFFF",
        }}
      >
        <span className="text-sm font-semibold">
          Total Expenses
        </span>

        <span className="whitespace-nowrap text-sm font-bold tabular-nums">
          {renderCurrencySymbol(lastExpense.symbol)}
          {displayAmount(lastExpense.total_expenses)}
        </span>
      </div>
    );
  };

  // RECEIPT BUTTON
  const renderReceipt = (expense: ExpenseResponse) => {
    if (!expense.upload_receipt_url) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const key = `receipt-${expense.sn}`;
    const fileName =
      expense.upload_receipt?.split("/").pop() || "Receipt";

    return (
      <div
        className="relative inline-block"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            setOpenAttachment(openAttachment === key ? null : key)
          }
          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600 transition hover:bg-orange-100"
        >
          <ReceiptText className="h-3 w-3" />
          Receipt
        </button>

        {openAttachment === key && (
          <>
            <button
              type="button"
              aria-label="Close receipt menu"
              className="fixed inset-0 z-[90] bg-black/30 lg:hidden"
              onClick={() => setOpenAttachment(null)}
            />

            <div className="fixed inset-x-3 bottom-3 z-[100] rounded-xl border border-gray-200 bg-white p-4 shadow-xl lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:w-64 lg:rounded-lg lg:p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Receipt
                </span>

                <button
                  type="button"
                  onClick={() => setOpenAttachment(null)}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />

                <span className="min-w-0 flex-1 truncate text-xs text-gray-600">
                  {fileName}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    openPreview(
                      expense.upload_receipt_url!,
                      fileName,
                      "image/*",
                    )
                  }
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  View
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // DOCUMENTS BUTTON
  const renderDocuments = (expense: ExpenseResponse) => {
    const documents = expense.documents ?? [];

    if (documents.length === 0) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const key = `documents-${expense.sn}`;

    return (
      <div
        className="relative inline-block"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            setOpenAttachment(openAttachment === key ? null : key)
          }
          className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-600 transition hover:bg-violet-100"
        >
          <Paperclip className="h-3 w-3" />
          {documents.length}{" "}
          {documents.length === 1 ? "Document" : "Documents"}
        </button>

        {openAttachment === key && (
          <>
            <button
              type="button"
              aria-label="Close documents menu"
              className="fixed inset-0 z-[90] bg-black/30 lg:hidden"
              onClick={() => setOpenAttachment(null)}
            />

            <div className="fixed inset-x-3 bottom-3 z-[100] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80 lg:rounded-lg lg:p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Documents ({documents.length})
                </span>

                <button
                  type="button"
                  onClick={() => setOpenAttachment(null)}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {documents.map((document) => {
                  const isPdf =
                    document.file_type === "application/pdf" ||
                    document.file_name.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={document.id}
                      className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-50"
                    >
                      {isPdf ? (
                        <FileText className="h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                      )}

                      <span
                        className="min-w-0 flex-1 truncate text-xs text-gray-600"
                        title={document.file_name}
                      >
                        {document.file_name}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openPreview(
                            document.file_url,
                            document.file_name,
                            document.file_type,
                          )
                        }
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // EDIT ATTACHMENTS
  const renderEditAttachments = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label
          htmlFor="edit_upload_receipt"
          className="mb-1.5 block text-xs font-semibold text-gray-600"
        >
          Replace Receipt
        </label>

        <input
          ref={editReceiptInputRef}
          id="edit_upload_receipt"
          type="file"
          accept="image/*"
          onChange={handleEditReceiptChange}
          className="block w-full rounded-md border border-gray-300 bg-white text-xs text-gray-600 file:mr-3 file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
        />

        <p className="mt-1 truncate text-[11px] text-gray-400">
          {editReceipt
            ? `Selected: ${editReceipt.name}`
            : "Leave empty to keep the existing receipt."}
        </p>
      </div>

      <div>
        <label
          htmlFor="edit_upload_doc"
          className="mb-1.5 block text-xs font-semibold text-gray-600"
        >
          Add Documents
        </label>

        <input
          ref={editDocumentsInputRef}
          id="edit_upload_doc"
          type="file"
          multiple
          accept="image/*,.pdf,application/pdf"
          onChange={handleEditDocumentsChange}
          className="block w-full rounded-md border border-gray-300 bg-white text-xs text-gray-600 file:mr-3 file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
        />

        <p className="mt-1 text-[11px] text-gray-400">
          {editDocuments.length > 0
            ? `${editDocuments.length} file(s) selected`
            : "Leave empty to keep existing documents."}
        </p>
      </div>
    </div>
  );

  // ACTIONS
  const renderActions = (expense: ExpenseResponse) => {
    const isEditing = editingSn === expense.sn;

    if (isEditing) {
      return (
        <div className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold">
          <button
            type="button"
            onClick={() => void saveEdit(expense.sn)}
            disabled={loading}
            className="text-emerald-700 hover:underline disabled:opacity-50"
          >
            Save
          </button>

          <button
            type="button"
            onClick={cancelEdit}
            disabled={loading}
            className="text-gray-500 hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 whitespace-nowrap text-xs font-medium">
        <button
          type="button"
          onClick={() => startEdit(expense)}
          className="text-blue-700 hover:underline"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => void handleDelete(expense.sn)}
          disabled={loading}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    );
  };

  // TABLE HEADER STYLE
  const headingClass =
    "whitespace-nowrap text-xs font-bold uppercase text-[#14383F]";

  // RENDER
  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-0">
          <div className="overflow-hidden">
            <Table
              striped
              className="min-w-[1100px] [&_tbody_tr]:border-b [&_tbody_tr]:border-gray-500"
            >
              <TableHead>
                <TableRow>
                  <TableHeadCell className={headingClass}>ID</TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Expenses
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Remarks
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Total Expenses
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Receipt
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Documents
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Added Date
                  </TableHeadCell>
                  <TableHeadCell className={headingClass}>
                    Action
                  </TableHeadCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y divide-gray-500">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center">
                      <ClipLoader size={24} color={THEME.primary} />
                    </TableCell>
                  </TableRow>
                ) : dataToDisplay.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-gray-500"
                    >
                      No expenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataToDisplay.map((expense) => {
                    const isEditing = editingSn === expense.sn;

                    return (
                      <React.Fragment key={expense.sn}>
                        <TableRow className="border-b border-gray-500 bg-white">
                          <TableCell className="whitespace-nowrap font-medium text-gray-700">
                            {expense.id}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                {renderCurrencySymbol(expense.symbol)}

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editAmount}
                                  onChange={(event) =>
                                    setEditAmount(
                                      event.target.value === ""
                                        ? ""
                                        : Number(event.target.value),
                                    )
                                  }
                                  className="w-28 rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-[#14383F] focus:ring-1 focus:ring-[#14383F]"
                                />
                              </div>
                            ) : (
                              <span className="whitespace-nowrap text-sm tabular-nums text-gray-700">
                                {renderCurrencySymbol(expense.symbol)}
                                {displayAmount(expense.add_expenses)}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <SearchInput
                                options={categories.map((category) => ({
                                  id: category.id,
                                  value: category.expense_category,
                                }))}
                                value={editCategory}
                                onChange={setEditCategory}
                                placeholder="Select category..."
                                className="w-full min-w-40"
                              />
                            ) : (
                              <span className="text-sm text-gray-700">
                                {expense.expense_category}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-800">
                              {renderCurrencySymbol(expense.symbol)}
                              {displayAmount(expense.total_expenses)}
                            </span>
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <span className="text-xs text-gray-400">
                                Edit below
                              </span>
                            ) : (
                              renderReceipt(expense)
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <span className="text-xs text-gray-400">
                                Edit below
                              </span>
                            ) : (
                              renderDocuments(expense)
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm text-gray-600">
                            {expense.created_date}
                          </TableCell>

                          <TableCell>{renderActions(expense)}</TableCell>
                        </TableRow>

                        {isEditing && (
                          <TableRow className="border-b border-gray-500 bg-gray-50">
                            <TableCell colSpan={8}>
                              <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                  <Paperclip className="h-4 w-4" />
                                  Update Attachments
                                </div>

                                {renderEditAttachments()}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}

                {!isLoading && lastExpense && (
                  <TableRow className="border-b border-gray-500">
                    <TableCell colSpan={8}>
                      {renderTotalBar()}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <div className="py-10 text-center">
            <ClipLoader size={24} color={THEME.primary} />
          </div>
        ) : dataToDisplay.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
            No expenses found.
          </div>
        ) : (
          dataToDisplay.map((expense) => {
            const isEditing = editingSn === expense.sn;

            return (
              <div
                key={expense.sn}
                className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    Expense #{expense.id}
                  </span>

                  {renderActions(expense)}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <SearchInput
                        options={categories.map((category) => ({
                          id: category.id,
                          value: category.expense_category,
                        }))}
                        value={editCategory}
                        onChange={setEditCategory}
                        placeholder="Select category..."
                        className="w-full"
                      />
                    ) : (
                      <p className="wrap-break-word text-sm text-gray-600">
                        {expense.expense_category}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        {renderCurrencySymbol(expense.symbol)}

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editAmount}
                          onChange={(event) =>
                            setEditAmount(
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                            )
                          }
                          className="w-24 rounded-md border border-gray-300 p-2 text-sm focus:border-[#14383F] focus:ring-1 focus:ring-[#14383F]"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-bold tabular-nums text-gray-800">
                        {renderCurrencySymbol(expense.symbol)}
                        {displayAmount(expense.add_expenses)}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex flex-wrap gap-2">
                    {renderReceipt(expense)}
                    {renderDocuments(expense)}
                  </div>
                )}

                {isEditing && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Paperclip className="h-4 w-4" />
                      Update Attachments
                    </div>

                    {renderEditAttachments()}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">
                    {expense.created_date}
                  </span>

                  <span className="text-right text-xs font-semibold tabular-nums text-gray-700">
                    Total: {renderCurrencySymbol(expense.symbol)}
                    {displayAmount(expense.total_expenses)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {!isLoading && lastExpense && renderTotalBar()}
      </div>

      {/* FILE PREVIEW */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-3 sm:p-6"
          onClick={closePreview}
        >
          <div
            className={`relative flex flex-col overflow-hidden bg-white shadow-2xl ${
              fullScreen
                ? "h-full w-full rounded-none"
                : "max-h-[94vh] w-full max-w-5xl rounded-xl"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                {isPdfFile(previewFile) ? (
                  <FileText className="h-5 w-5 shrink-0 text-red-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 shrink-0 text-blue-500" />
                )}

                <p
                  className="max-w-[180px] truncate text-sm font-semibold text-gray-700 sm:max-w-md"
                  title={previewFile.fileName}
                >
                  {previewFile.fileName}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {isImageFile(previewFile) && (
                  <button
                    type="button"
                    onClick={() => setFullScreen(!fullScreen)}
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                    title={fullScreen ? "Exit full view" : "View full"}
                  >
                    {fullScreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              className={`flex items-center justify-center overflow-auto bg-gray-100 ${
                fullScreen
                  ? "flex-1"
                  : "min-h-[300px] max-h-[calc(94vh-3.5rem)]"
              }`}
            >
              {isImageFile(previewFile) && (
                <div className="flex h-full w-full items-center justify-center p-3 sm:p-6">
                  <img
                    src={previewFile.url}
                    alt={previewFile.fileName}
                    className={`rounded-md object-contain shadow-sm ${
                      fullScreen
                        ? "max-h-full max-w-full"
                        : "max-h-[78vh] max-w-full"
                    }`}
                    onError={() =>
                      toast.error("Unable to load the image.")
                    }
                  />
                </div>
              )}

              {isPdfFile(previewFile) && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.fileName}
                  className="h-[75vh] w-full border-0 sm:h-[80vh]"
                />
              )}

              {!isImageFile(previewFile) &&
                !isPdfFile(previewFile) && (
                  <div className="p-8 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Preview is not available for this file type.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesTable;
