"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface ExpensesTableProps {
  filteredData?: ExpenseResponse[];
  isFilterActive?: boolean;
  onDataChange?: () => void;

  // Parent component props
  refreshTrigger?: number;
  onSuccess?: () => void;
  onDataLoad?: (data: ExpenseResponse[]) => void;
}

interface PreviewFile {
  url: string;
  fileName: string;
  fileType: string;
}

const DESKTOP_TOTAL_COLOR = "#FF7043";

// Mobile (< lg): bottom sheet pinned to the bottom of the screen.
// Desktop (>= lg): anchored dropdown under the button.
const POPUP_BASE =
  "fixed inset-x-0 bottom-0 z-[200] max-h-[75vh] overflow-y-auto bg-white rounded-t-2xl border-t border-gray-200 shadow-2xl p-3 pb-[max(1rem,env(safe-area-inset-bottom))] " +
  "lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:z-[80] lg:max-h-none lg:overflow-visible lg:rounded-lg lg:border lg:shadow-xl lg:p-2 lg:pb-2";

// Dim background behind the bottom sheet (mobile only)
const POPUP_BACKDROP_CLASS = "fixed inset-0 z-[199] bg-black/40 lg:hidden";

// Small drag-handle style bar at the top of the sheet (mobile only)
const POPUP_HANDLE_CLASS =
  "mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300 lg:hidden";

const RECEIPT_POPUP_CLASS = `${POPUP_BASE} lg:w-60`;
const DOCUMENTS_POPUP_CLASS = `${POPUP_BASE} lg:w-80`;

const ExpensesTable = ({
  filteredData,
  isFilterActive = false,
  onDataChange,
  refreshTrigger,
  onSuccess,
  onDataLoad,
}: ExpensesTableProps) => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);

  const [editingSn, setEditingSn] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("");
  const [editReceipt, setEditReceipt] = useState<File | null>(null);
  const [editDocuments, setEditDocuments] = useState<File[]>([]);

  const editReceiptInputRef = useRef<HTMLInputElement | null>(null);
  const editDocumentsInputRef = useRef<HTMLInputElement | null>(null);

  const [openAttachment, setOpenAttachment] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const [loading, setLoading] = useState(false); // save / delete actions
  const [fetching, setFetching] = useState(true); // table loading

  // ---------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------

  const loadExpenses = async () => {
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
  };

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategoriesService();
      setCategories(data);
    } catch (error: any) {
      console.error("Failed to fetch expense categories:", error);
      toast.error("Failed to fetch expense categories");
    }
  };

  useEffect(() => {
    if (!isFilterActive) {
      loadExpenses();
    } else {
      setFetching(false);
    }
  }, [isFilterActive]);

  useEffect(() => {
    if (refreshTrigger !== undefined && !isFilterActive) {
      loadExpenses();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    loadCategories();
  }, []);

  // ---------------------------------------------------------
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ---------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenAttachment(null);
    };

    if (openAttachment) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openAttachment]);

  // ---------------------------------------------------------
  // ESCAPE
  // ---------------------------------------------------------

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (previewFile) {
        closePreview();
      } else {
        setOpenAttachment(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [previewFile]);

  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  const dataToDisplay = isFilterActive ? (filteredData ?? []) : expenses;
  const isLoading = fetching && !isFilterActive;

  // ---------------------------------------------------------
  // EDIT HELPERS
  // ---------------------------------------------------------

  const resetFileInputs = () => {
    if (editReceiptInputRef.current) {
      editReceiptInputRef.current.value = "";
    }
    if (editDocumentsInputRef.current) {
      editDocumentsInputRef.current.value = "";
    }
  };

  const startEdit = (expense: ExpenseResponse) => {
    setEditingSn(expense.sn);
    setEditAmount(Number(expense.add_expenses));
    setEditCategory(expense.expense_category);
    setEditReceipt(null);
    setEditDocuments([]);
    resetFileInputs();
    setOpenAttachment(null);
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
    const file = event.target.files?.[0] || null;

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
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setEditDocuments([]);
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") && file.type !== "application/pdf",
    );

    if (invalidFiles.length > 0) {
      toast.error("Only image and PDF files are allowed.");
      event.target.value = "";
      setEditDocuments([]);
      return;
    }

    setEditDocuments(files);
  };

  // ---------------------------------------------------------
  // SAVE EDIT
  // ---------------------------------------------------------

  const saveEdit = async (sn: string) => {
    if (editAmount === "" || Number(editAmount) <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    const categoryExists = categories.some(
      (cat) =>
        cat.expense_category.toLowerCase() === editCategory.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error("Please select a valid category from the list");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("add_expenses", String(editAmount));
      formData.append("expense_category", editCategory);

      // New receipt is optional.
      if (editReceipt) {
        formData.append("upload_receipt", editReceipt);
      }

      // New documents are optional.
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
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to update expense:", error);
      toast.error(error?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

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
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to delete expense:", error);
      toast.error(error?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // PREVIEW
  // ---------------------------------------------------------

  const openPreview = (url: string, fileName: string, fileType: string) => {
    setOpenAttachment(null);
    setPreviewFile({ url, fileName, fileType });
    setFullScreen(false);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setFullScreen(false);
  };

  const isPdfFile = (file: PreviewFile) => {
    return (
      file.fileType === "application/pdf" ||
      file.fileName.toLowerCase().endsWith(".pdf")
    );
  };

  const isImageFile = (file: PreviewFile) => {
    return (
      file.fileType.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.fileName)
    );
  };

  // ---------------------------------------------------------
  // RECEIPT VIEW
  // ---------------------------------------------------------

  const renderReceipt = (expense: ExpenseResponse) => {
    if (!expense.upload_receipt_url) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const key = `receipt-${expense.sn}`;
    const receiptFileName =
      expense.upload_receipt?.split("/").pop() || "Receipt";

    return (
      <div
        className="relative inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpenAttachment(openAttachment === key ? null : key)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer whitespace-nowrap"
        >
          <ReceiptText className="w-4 h-4" />
          <span className="text-xs font-semibold">Receipt</span>
        </button>

        {openAttachment === key && (
          <>
            <div
              className={POPUP_BACKDROP_CLASS}
              onClick={() => setOpenAttachment(null)}
            />
            <div className={RECEIPT_POPUP_CLASS}>
              <div className={POPUP_HANDLE_CLASS} />
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <ReceiptText className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">
                    Receipt
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenAttachment(null)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-50">
                  <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">
                      {receiptFileName}
                    </p>
                    <p className="text-[10px] text-gray-400">IMAGE</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openPreview(
                        expense.upload_receipt_url!,
                        receiptFileName,
                        "image/*",
                      )
                    }
                    className="shrink-0 px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------
  // DOCUMENTS VIEW
  // ---------------------------------------------------------

  const renderDocuments = (expense: ExpenseResponse) => {
    const documents = expense.documents || [];

    if (documents.length === 0) {
      return <span className="text-xs text-gray-400">—</span>;
    }

    const key = `documents-${expense.sn}`;

    return (
      <div
        className="relative inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpenAttachment(openAttachment === key ? null : key)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Paperclip className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {documents.length}{" "}
            {documents.length === 1 ? "Document" : "Documents"}
          </span>
        </button>

        {openAttachment === key && (
          <>
            <div
              className={POPUP_BACKDROP_CLASS}
              onClick={() => setOpenAttachment(null)}
            />
            <div className={DOCUMENTS_POPUP_CLASS}>
              <div className={POPUP_HANDLE_CLASS} />
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">
                    Documents ({documents.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenAttachment(null)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1 max-h-[280px] overflow-y-auto">
                {documents.map((document) => {
                  const isPdf =
                    document.file_type === "application/pdf" ||
                    document.file_name.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={document.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-50"
                    >
                      {isPdf ? (
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-xs font-medium text-gray-700"
                          title={document.file_name}
                        >
                          {document.file_name}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {isPdf ? "PDF" : "IMAGE"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openPreview(
                            document.file_url,
                            document.file_name,
                            document.file_type,
                          )
                        }
                        className="shrink-0 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs font-semibold cursor-pointer"
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

  // ---------------------------------------------------------
  // EDIT ATTACHMENT AREA
  // ---------------------------------------------------------

  const renderEditAttachments = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
        {/* RECEIPT */}
        <div>
          <label
            htmlFor="edit_upload_receipt"
            className="block text-xs font-semibold text-gray-600 mb-1.5"
          >
            Replace Receipt
          </label>

          <input
            ref={editReceiptInputRef}
            id="edit_upload_receipt"
            type="file"
            accept="image/*"
            onChange={handleEditReceiptChange}
            className="block w-full text-xs text-gray-600 border border-gray-300 rounded-md cursor-pointer bg-white file:mr-3 file:py-2 file:px-3 file:rounded-l-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />

          {editReceipt ? (
            <p className="mt-1 text-[11px] text-gray-500 truncate">
              New receipt: {editReceipt.name}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">
              Leave empty to keep current receipt
            </p>
          )}
        </div>

        {/* DOCUMENTS */}
        <div>
          <label
            htmlFor="edit_upload_doc"
            className="block text-xs font-semibold text-gray-600 mb-1.5"
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
            className="block w-full text-xs text-gray-600 border border-gray-300 rounded-md cursor-pointer bg-white file:mr-3 file:py-2 file:px-3 file:rounded-l-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />

          {editDocuments.length > 0 ? (
            <p className="mt-1 text-[11px] text-gray-500">
              {editDocuments.length} new file
              {editDocuments.length > 1 ? "s" : ""} selected
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">
              Leave empty to keep current documents
            </p>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // TOTAL
  // ---------------------------------------------------------

  const lastExpense =
    dataToDisplay.length > 0 ? dataToDisplay[dataToDisplay.length - 1] : null;

  // ---------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------

  return (
    <>
      {/* =====================================================
          DESKTOP TABLE VIEW
      ===================================================== */}

      <div className="hidden lg:block -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table striped theme={{ root: { wrapper: "relative" } }}>
            <TableHead className="text-lg">
              <TableRow>
                <TableHeadCell className="">ID</TableHeadCell>
                <TableHeadCell className="">Expenses</TableHeadCell>
                <TableHeadCell className="">Remarks</TableHeadCell>
                <TableHeadCell className="">Total Expenses</TableHeadCell>
                <TableHeadCell className="">Receipt</TableHeadCell>
                <TableHeadCell className="">Documents</TableHeadCell>
                <TableHeadCell className="">Added Date</TableHeadCell>
                <TableHeadCell className="">Action</TableHeadCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center font-medium text-gray-500"
                  >
                    <ClipLoader size={22} color="#000000" />
                  </TableCell>
                </TableRow>
              ) : dataToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center font-medium text-gray-500"
                  >
                    No Expenses found
                  </TableCell>
                </TableRow>
              ) : (
                dataToDisplay.map((expense) => {
                  const isEditing = editingSn === expense.sn;

                  return (
                    <React.Fragment key={expense.sn}>
                      <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {expense.id}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <>
                              {expense.symbol || ""}{" "}
                              <input
                                type="number"
                                className="p-2 border rounded-md border-gray-300 w-28 outline-none focus:border-[#FF7043]"
                                value={editAmount}
                                onChange={(e) =>
                                  setEditAmount(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </>
                          ) : (
                            <>
                              {expense.symbol || ""}
                              {expense.add_expenses}
                            </>
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <SearchInput
                              options={categories.map((cat) => ({
                                id: cat.id,
                                value: cat.expense_category,
                              }))}
                              value={editCategory ?? ""}
                              onChange={setEditCategory}
                              placeholder="Select category..."
                              className="w-full sm:w-64"
                            />
                          ) : (
                            expense.expense_category
                          )}
                        </TableCell>

                        <TableCell className="font-semibold">
                          {expense.symbol || ""}
                          {expense.total_expenses}
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

                        <TableCell>{expense.created_date}</TableCell>

                        <TableCell>
                          {isEditing ? (
                            <>
                              <button
                                className="text-green-600 mr-2 cursor-pointer disabled:opacity-50"
                                onClick={() => saveEdit(expense.sn)}
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                className="text-gray-600 cursor-pointer"
                                onClick={cancelEdit}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="text-blue-600 font-medium cursor-pointer"
                                onClick={() => startEdit(expense)}
                              >
                                Edit
                              </button>
                              <button
                                className="font-medium text-red-600 hover:underline dark:text-red-500 ml-2 cursor-pointer disabled:opacity-50"
                                onClick={() => handleDelete(expense.sn)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* EDIT ATTACHMENTS */}
                      {isEditing && (
                        <TableRow className="bg-orange-50/40">
                          <TableCell colSpan={8}>
                            <div className="rounded-lg border border-orange-100 bg-white p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                  Update Attachments
                                </span>
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

              {/* TOTAL EXPENSES BAR */}
              {!isLoading && lastExpense && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div
                      className="flex justify-between items-center p-4 text-white font-semibold rounded-lg shadow mt-2"
                      style={{ backgroundColor: DESKTOP_TOTAL_COLOR }}
                    >
                      <span>Total Expenses</span>
                      <span>
                        {lastExpense.symbol || ""}
                        {lastExpense.total_expenses}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* =====================================================
          MOBILE CARD VIEW
      ===================================================== */}

      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="text-center font-medium text-gray-500">
            <ClipLoader size={22} color="#000000" />
          </div>
        ) : dataToDisplay.length === 0 ? (
          <div className="text-center font-medium text-gray-500">
            No Expenses found
          </div>
        ) : (
          dataToDisplay.map((expense) => {
            const isEditing = editingSn === expense.sn;

            return (
              <div
                key={expense.sn}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col gap-2"
              >
                {/* Row 1: ID and Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">
                    ID {expense.id}
                  </span>

                  <div className="flex gap-1 text-xs font-bold">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(expense.sn)}
                          disabled={loading}
                          className="text-green-600 hover:underline disabled:opacity-50"
                        >
                          Save
                        </button>
                        <span className="text-gray-300">/</span>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(expense)}
                          className="text-[#FFAA00] hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">/</span>
                        <button
                          onClick={() => handleDelete(expense.sn)}
                          disabled={loading}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Row 2: Category and Amount */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    {isEditing ? (
                      <SearchInput
                        options={categories.map((cat) => ({
                          id: cat.id,
                          value: cat.expense_category,
                        }))}
                        value={editCategory ?? ""}
                        onChange={setEditCategory}
                        placeholder="Category..."
                        className="w-full text-xs"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        {expense.expense_category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {expense.symbol || ""}
                        </span>
                        <input
                          type="number"
                          className="w-24 p-1 text-sm border rounded focus:ring-1 focus:ring-[#FFAA00]"
                          value={editAmount}
                          onChange={(e) =>
                            setEditAmount(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-800">
                        Expense {expense.symbol || ""}
                        {expense.add_expenses}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Attachments */}
                {!isEditing && (
                  <div className="flex flex-wrap gap-2">
                    {renderReceipt(expense)}
                    {renderDocuments(expense)}
                  </div>
                )}

                {/* Edit attachments */}
                {isEditing && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Update Attachments
                      </span>
                    </div>

                    {renderEditAttachments()}
                  </div>
                )}

                {/* Row 4: Date and Total */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {expense.created_date}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    Total Expenses {expense.symbol || ""}
                    {expense.total_expenses}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Total Expenses Card */}
        {!isLoading && lastExpense && (
          <div
            className="p-4 text-white font-semibold rounded-lg shadow"
            style={{ backgroundColor: DESKTOP_TOTAL_COLOR }}
          >
            <div className="flex justify-between items-center">
              <span>Total Expenses</span>
              <span>
                {lastExpense.symbol || ""}
                {lastExpense.total_expenses}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          IMAGE / PDF PREVIEW POPUP
      ===================================================== */}

      {previewFile && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-3 sm:p-6"
          onClick={closePreview}
        >
          <div
            className={`relative bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col ${
              fullScreen
                ? "w-full h-full rounded-none"
                : "w-full max-w-5xl max-h-[94vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="shrink-0 h-14 px-3 sm:px-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 min-w-0">
                {isPdfFile(previewFile) ? (
                  <FileText className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                )}

                <p
                  className="text-sm font-semibold text-gray-700 truncate max-w-[180px] sm:max-w-md"
                  title={previewFile.fileName}
                >
                  {previewFile.fileName}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isImageFile(previewFile) && (
                  <button
                    type="button"
                    onClick={() => setFullScreen(!fullScreen)}
                    className="p-2 rounded-md hover:bg-gray-100 text-gray-600 cursor-pointer"
                    title={fullScreen ? "Exit full view" : "View Full"}
                  >
                    {fullScreen ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={closePreview}
                  className="p-2 rounded-md hover:bg-gray-100 text-gray-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div
              className={`flex items-center justify-center bg-gray-100 overflow-auto ${
                fullScreen
                  ? "flex-1"
                  : "min-h-[300px] max-h-[calc(94vh-3.5rem)]"
              }`}
            >
              {isImageFile(previewFile) && (
                <div className="w-full h-full flex items-center justify-center p-3 sm:p-6">
                  <img
                    src={previewFile.url}
                    alt={previewFile.fileName}
                    className={`object-contain rounded-md shadow-sm ${
                      fullScreen
                        ? "max-w-full max-h-full"
                        : "max-w-full max-h-[78vh]"
                    }`}
                    onError={() => {
                      toast.error("Unable to load the image.");
                    }}
                  />
                </div>
              )}

              {isPdfFile(previewFile) && (
                <iframe
                  src={previewFile.url}
                  title={previewFile.fileName}
                  className="w-full h-[75vh] sm:h-[80vh] border-0"
                />
              )}

              {!isImageFile(previewFile) && !isPdfFile(previewFile) && (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
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
