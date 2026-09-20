"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  Save,
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

const ExpensesTable = ({
  filteredData,
  isFilterActive = false,
  onDataChange,
  refreshTrigger,
  onSuccess,
  onDataLoad,
}: ExpensesTableProps) => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);

  const [categories, setCategories] = useState<
    ExpenseCategoryResponse[]
  >([]);

  const [editingSn, setEditingSn] = useState<string | null>(null);

  const [editAmount, setEditAmount] = useState<number | "">("");

  const [editCategory, setEditCategory] = useState("");

  const [editReceipt, setEditReceipt] = useState<File | null>(null);

  const [editDocuments, setEditDocuments] = useState<File[]>([]);

  const editReceiptInputRef =
    useRef<HTMLInputElement | null>(null);

  const editDocumentsInputRef =
    useRef<HTMLInputElement | null>(null);

  const [openAttachment, setOpenAttachment] =
    useState<string | null>(null);

  const [previewFile, setPreviewFile] =
    useState<PreviewFile | null>(null);

  const [fullScreen, setFullScreen] = useState(false);

  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // LOAD EXPENSES
  // ---------------------------------------------------------

  const loadExpenses = async () => {
    try {
      const data = await getExpenseService();

      setExpenses(data);

      // Send loaded data to parent
      onDataLoad?.(data);
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error);

      toast.error(
        error?.message || "Failed to fetch expenses"
      );
    }
  };

  // ---------------------------------------------------------
  // LOAD CATEGORIES
  // ---------------------------------------------------------

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategoriesService();

      setCategories(data);
    } catch (error: any) {
      console.error(
        "Failed to fetch expense categories:",
        error
      );

      toast.error(
        "Failed to fetch expense categories"
      );
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isFilterActive) {
      loadExpenses();
    }
  }, [isFilterActive]);

  // ---------------------------------------------------------
  // REFRESH WHEN refreshTrigger CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    if (
      refreshTrigger !== undefined &&
      !isFilterActive
    ) {
      loadExpenses();
    }
  }, [refreshTrigger]);

  // ---------------------------------------------------------
  // LOAD CATEGORIES
  // ---------------------------------------------------------

  useEffect(() => {
    loadCategories();
  }, []);

  // ---------------------------------------------------------
  // CLOSE DROPDOWN
  // ---------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenAttachment(null);
    };

    if (openAttachment) {
      document.addEventListener(
        "click",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      );
    };
  }, [openAttachment]);

  // ---------------------------------------------------------
  // ESCAPE
  // ---------------------------------------------------------

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      if (previewFile) {
        closePreview();
      } else {
        setOpenAttachment(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [previewFile]);

  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  const dataToDisplay = isFilterActive
    ? filteredData ?? []
    : expenses;

  // ---------------------------------------------------------
  // START EDIT
  // ---------------------------------------------------------

  const startEdit = (
    expense: ExpenseResponse
  ) => {
    setEditingSn(expense.sn);

    setEditAmount(
      Number(expense.add_expenses)
    );

    setEditCategory(
      expense.expense_category
    );

    setEditReceipt(null);

    setEditDocuments([]);

    if (editReceiptInputRef.current) {
      editReceiptInputRef.current.value = "";
    }

    if (editDocumentsInputRef.current) {
      editDocumentsInputRef.current.value = "";
    }

    setOpenAttachment(null);
  };

  // ---------------------------------------------------------
  // CANCEL EDIT
  // ---------------------------------------------------------

  const cancelEdit = () => {
    setEditingSn(null);

    setEditAmount("");

    setEditCategory("");

    setEditReceipt(null);

    setEditDocuments([]);

    if (editReceiptInputRef.current) {
      editReceiptInputRef.current.value = "";
    }

    if (editDocumentsInputRef.current) {
      editDocumentsInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // EDIT RECEIPT
  // ---------------------------------------------------------

  const handleEditReceiptChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setEditReceipt(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Receipt must be an image file."
      );

      event.target.value = "";

      setEditReceipt(null);

      return;
    }

    setEditReceipt(file);
  };

  // ---------------------------------------------------------
  // EDIT DOCUMENTS
  // ---------------------------------------------------------

  const handleEditDocumentsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      setEditDocuments([]);
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") &&
        file.type !== "application/pdf"
    );

    if (invalidFiles.length > 0) {
      toast.error(
        "Only image and PDF files are allowed."
      );

      event.target.value = "";

      setEditDocuments([]);

      return;
    }

    setEditDocuments(files);
  };

  // ---------------------------------------------------------
  // SAVE EDIT
  // ---------------------------------------------------------

  const saveEdit = async (
    sn: string
  ) => {
    if (
      editAmount === "" ||
      Number(editAmount) <= 0
    ) {
      toast.error(
        "Please enter a valid expense amount"
      );

      return;
    }

    const categoryExists = categories.some(
      (cat) =>
        cat.expense_category.toLowerCase() ===
        editCategory.toLowerCase()
    );

    if (!categoryExists) {
      toast.error(
        "Please select a valid category from the list"
      );

      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "add_expenses",
        String(editAmount)
      );

      formData.append(
        "expense_category",
        editCategory
      );

      // New receipt is optional.
      // If selected, Laravel can replace/update receipt.
      if (editReceipt) {
        formData.append(
          "upload_receipt",
          editReceipt
        );
      }

      // New documents are optional.
      // If selected, Laravel will save them.
      editDocuments.forEach((file) => {
        formData.append(
          "upload_doc[]",
          file
        );
      });

      await updateExpenseService(
        sn,
        formData
      );

      toast.success(
        "Expense updated successfully."
      );

      cancelEdit();

      if (isFilterActive) {
        onDataChange?.();
      } else {
        await loadExpenses();
      }

      onSuccess?.();

      onDataChange?.();
    } catch (error: any) {
      console.error(
        "Failed to update expense:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to update expense"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  const handleDelete = async (
    sn: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteExpenseService(sn);

      toast.success(
        "Expense deleted successfully."
      );

      if (isFilterActive) {
        onDataChange?.();
      } else {
        await loadExpenses();
      }

      onSuccess?.();

      onDataChange?.();
    } catch (error: any) {
      console.error(
        "Failed to delete expense:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to delete expense"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // PREVIEW
  // ---------------------------------------------------------

  const openPreview = (
    url: string,
    fileName: string,
    fileType: string
  ) => {
    setOpenAttachment(null);

    setPreviewFile({
      url,
      fileName,
      fileType,
    });

    setFullScreen(false);
  };

  const closePreview = () => {
    setPreviewFile(null);

    setFullScreen(false);
  };

  const isPdfFile = (
    file: PreviewFile
  ) => {
    return (
      file.fileType ===
        "application/pdf" ||
      file.fileName
        .toLowerCase()
        .endsWith(".pdf")
    );
  };

  const isImageFile = (
    file: PreviewFile
  ) => {
    return (
      file.fileType.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
        file.fileName
      )
    );
  };

  // ---------------------------------------------------------
  // RECEIPT VIEW
  // ---------------------------------------------------------

  const renderReceipt = (
    expense: ExpenseResponse
  ) => {
    if (!expense.upload_receipt_url) {
      return (
        <span className="text-xs text-gray-400">
          —
        </span>
      );
    }

    const key = `receipt-${expense.sn}`;

    const receiptFileName =
      expense.upload_receipt
        ?.split("/")
        .pop() || "Receipt";

    return (
      <div
        className="relative inline-block"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={() =>
            setOpenAttachment(
              openAttachment === key
                ? null
                : key
            )
          }
          className="
            inline-flex items-center justify-center
            gap-1.5 px-3 py-1.5
            rounded-md
            bg-blue-50 text-blue-600
            hover:bg-blue-100
            border border-blue-200
            transition-colors
            cursor-pointer
            whitespace-nowrap
          "
        >
          <ReceiptText className="w-4 h-4" />

          <span className="text-xs font-semibold">
            Receipt
          </span>
        </button>

        {openAttachment === key && (
          <div
            className="
              absolute
              z-[80]
              right-0
              top-full
              mt-2
              w-[calc(100vw-32px)]
              max-w-[260px]
              sm:w-60
              bg-white
              rounded-lg
              border border-gray-200
              shadow-xl
              p-2
            "
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <ReceiptText className="w-4 h-4 text-blue-500 shrink-0" />

                <span className="text-xs font-semibold text-gray-700">
                  Receipt
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpenAttachment(null)
                }
                className="
                  p-1 rounded
                  hover:bg-gray-100
                  text-gray-400
                  hover:text-gray-700
                  cursor-pointer
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <div
                className="
                  flex items-center gap-2
                  px-2 py-2
                  rounded-md
                  hover:bg-gray-50
                "
              >
                <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">
                    {receiptFileName}
                  </p>

                  <p className="text-[10px] text-gray-400">
                    IMAGE
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openPreview(
                      expense.upload_receipt_url!,
                      receiptFileName,
                      "image/*"
                    )
                  }
                  className="
                    shrink-0
                    px-2.5 py-1
                    rounded-md
                    bg-blue-50
                    hover:bg-blue-100
                    text-blue-600
                    text-xs
                    font-semibold
                    cursor-pointer
                  "
                >
                  View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------
  // DOCUMENTS VIEW
  // ---------------------------------------------------------

  const renderDocuments = (
    expense: ExpenseResponse
  ) => {
    const documents =
      expense.documents || [];

    if (documents.length === 0) {
      return (
        <span className="text-xs text-gray-400">
          —
        </span>
      );
    }

    const key = `documents-${expense.sn}`;

    return (
      <div
        className="relative inline-block"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={() =>
            setOpenAttachment(
              openAttachment === key
                ? null
                : key
            )
          }
          className="
            inline-flex items-center justify-center
            gap-1.5 px-3 py-1.5
            rounded-md
            bg-purple-50 text-purple-600
            hover:bg-purple-100
            border border-purple-200
            transition-colors
            cursor-pointer
            whitespace-nowrap
          "
        >
          <Paperclip className="w-4 h-4" />

          <span className="text-xs font-semibold">
            {documents.length}{" "}
            {documents.length === 1
              ? "Document"
              : "Documents"}
          </span>
        </button>

        {openAttachment === key && (
          <div
            className="
              absolute
              z-[80]
              right-0
              top-full
              mt-2
              w-[calc(100vw-32px)]
              max-w-[320px]
              sm:w-80
              bg-white
              rounded-lg
              border border-gray-200
              shadow-xl
              p-2
            "
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-purple-500 shrink-0" />

                <span className="text-xs font-semibold text-gray-700">
                  Documents ({documents.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpenAttachment(null)
                }
                className="
                  p-1 rounded
                  hover:bg-gray-100
                  text-gray-400
                  hover:text-gray-700
                  cursor-pointer
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="
                border-t border-gray-100
                pt-2 space-y-1
                max-h-[280px]
                overflow-y-auto
              "
            >
              {documents.map(
                (document) => {
                  const isPdf =
                    document.file_type ===
                      "application/pdf" ||
                    document.file_name
                      .toLowerCase()
                      .endsWith(".pdf");

                  return (
                    <div
                      key={document.id}
                      className="
                        flex items-center gap-2
                        px-2 py-2
                        rounded-md
                        hover:bg-gray-50
                      "
                    >
                      {isPdf ? (
                        <FileText
                          className="
                            w-4 h-4
                            text-red-500
                            shrink-0
                          "
                        />
                      ) : (
                        <ImageIcon
                          className="
                            w-4 h-4
                            text-blue-500
                            shrink-0
                          "
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <p
                          className="
                            truncate
                            text-xs
                            font-medium
                            text-gray-700
                          "
                          title={
                            document.file_name
                          }
                        >
                          {document.file_name}
                        </p>

                        <p className="text-[10px] text-gray-400 uppercase">
                          {isPdf
                            ? "PDF"
                            : "IMAGE"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openPreview(
                            document.file_url,
                            document.file_name,
                            document.file_type
                          )
                        }
                        className="
                          shrink-0
                          px-2.5 py-1
                          rounded-md
                          bg-purple-50
                          hover:bg-purple-100
                          text-purple-600
                          text-xs
                          font-semibold
                          cursor-pointer
                        "
                      >
                        View
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>
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
            className="
              block text-xs
              font-semibold
              text-gray-600
              mb-1.5
            "
          >
            Replace Receipt
          </label>

          <input
            ref={editReceiptInputRef}
            id="edit_upload_receipt"
            type="file"
            accept="image/*"
            onChange={
              handleEditReceiptChange
            }
            className="
              block w-full
              text-xs text-gray-600
              border border-gray-300
              rounded-md
              cursor-pointer
              bg-white
              file:mr-3
              file:py-2
              file:px-3
              file:rounded-l-md
              file:border-0
              file:text-xs
              file:font-semibold
              file:bg-gray-100
              file:text-gray-700
              hover:file:bg-gray-200
            "
          />

          {editReceipt && (
            <p className="mt-1 text-[11px] text-gray-500 truncate">
              New receipt:{" "}
              {editReceipt.name}
            </p>
          )}

          {!editReceipt && (
            <p className="mt-1 text-[11px] text-gray-400">
              Leave empty to keep current receipt
            </p>
          )}
        </div>

        {/* DOCUMENTS */}

        <div>
          <label
            htmlFor="edit_upload_doc"
            className="
              block text-xs
              font-semibold
              text-gray-600
              mb-1.5
            "
          >
            Add Documents
          </label>

          <input
            ref={editDocumentsInputRef}
            id="edit_upload_doc"
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            onChange={
              handleEditDocumentsChange
            }
            className="
              block w-full
              text-xs text-gray-600
              border border-gray-300
              rounded-md
              cursor-pointer
              bg-white
              file:mr-3
              file:py-2
              file:px-3
              file:rounded-l-md
              file:border-0
              file:text-xs
              file:font-semibold
              file:bg-gray-100
              file:text-gray-700
              hover:file:bg-gray-200
            "
          />

          {editDocuments.length > 0 && (
            <p className="mt-1 text-[11px] text-gray-500">
              {editDocuments.length} new file
              {editDocuments.length > 1
                ? "s"
                : ""}{" "}
              selected
            </p>
          )}

          {editDocuments.length === 0 && (
            <p className="mt-1 text-[11px] text-gray-400">
              Leave empty to keep current documents
            </p>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------

  return (
    <>
      <div className="w-full bg-white rounded-md shadow-sm">

        {/* =====================================================
            DESKTOP TABLE
        ===================================================== */}

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">

            <thead className="text-xs uppercase bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">
                  ID
                </th>

                <th className="px-4 py-3">
                  Expenses
                </th>

                <th className="px-4 py-3">
                  Remarks
                </th>

                <th className="px-4 py-3">
                  Total Expenses
                </th>

                <th className="px-4 py-3">
                  Receipt
                </th>

                <th className="px-4 py-3">
                  Documents
                </th>

                <th className="px-4 py-3">
                  Added Date
                </th>

                <th className="px-4 py-3 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {dataToDisplay.length > 0 ? (
                dataToDisplay.map(
                  (expense) => {
                    const isEditing =
                      editingSn ===
                      expense.sn;

                    return (
                      <React.Fragment
                        key={expense.sn}
                      >
                        <tr
                          className="
                            border-b
                            hover:bg-gray-50
                          "
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {expense.id}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={
                                  editAmount
                                }
                                onChange={(e) =>
                                  setEditAmount(
                                    e.target
                                      .value ===
                                      ""
                                      ? ""
                                      : Number(
                                          e.target
                                            .value
                                        )
                                  )
                                }
                                className="
                                  w-28
                                  h-9
                                  px-2
                                  border
                                  border-gray-300
                                  rounded-md
                                  outline-none
                                  focus:border-[#FFA726]
                                "
                              />
                            ) : (
                              <>
                                {expense.symbol ||
                                  ""}

                                {
                                  expense.add_expenses
                                }
                              </>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <SearchInput
                                options={categories.map(
                                  (cat) => ({
                                    id: cat.id,
                                    value:
                                      cat.expense_category,
                                  })
                                )}
                                value={
                                  editCategory ??
                                  ""
                                }
                                onChange={
                                  setEditCategory
                                }
                                placeholder="Select category..."
                                className="w-56"
                              />
                            ) : (
                              expense.expense_category
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {expense.symbol ||
                              ""}

                            {
                              expense.total_expenses
                            }
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <span className="text-xs text-gray-400">
                                Edit below
                              </span>
                            ) : (
                              renderReceipt(
                                expense
                              )
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <span className="text-xs text-gray-400">
                                Edit below
                              </span>
                            ) : (
                              renderDocuments(
                                expense
                              )
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {
                              expense.created_date
                            }
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">

                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveEdit(
                                        expense.sn
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                    className="
                                      p-2
                                      rounded-md
                                      bg-green-50
                                      text-green-600
                                      hover:bg-green-100
                                      cursor-pointer
                                      disabled:opacity-50
                                    "
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelEdit
                                    }
                                    disabled={
                                      loading
                                    }
                                    className="
                                      p-2
                                      rounded-md
                                      bg-gray-50
                                      text-gray-600
                                      hover:bg-gray-100
                                      cursor-pointer
                                    "
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEdit(
                                        expense
                                      )
                                    }
                                    className="
                                      p-2
                                      rounded-md
                                      bg-blue-50
                                      text-blue-600
                                      hover:bg-blue-100
                                      cursor-pointer
                                    "
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        expense.sn
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                    className="
                                      p-2
                                      rounded-md
                                      bg-red-50
                                      text-red-600
                                      hover:bg-red-100
                                      cursor-pointer
                                      disabled:opacity-50
                                    "
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                            </div>
                          </td>
                        </tr>

                        {/* EDIT ATTACHMENTS */}

                        {isEditing && (
                          <tr className="border-b bg-gray-50">
                            <td
                              colSpan={8}
                              className="px-4 py-4"
                            >
                              <div className="rounded-lg border border-gray-200 bg-white p-4">

                                <div className="flex items-center gap-2 mb-3">
                                  <Paperclip className="w-4 h-4 text-gray-500" />

                                  <span className="text-sm font-semibold text-gray-700">
                                    Update Attachments
                                  </span>
                                </div>

                                {renderEditAttachments()}

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      px-4 py-8
                      text-center
                      text-gray-400
                    "
                  >
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            MOBILE CARDS
        ===================================================== */}

        <div className="md:hidden divide-y divide-gray-100">

          {dataToDisplay.length > 0 ? (
            dataToDisplay.map(
              (expense) => {
                const isEditing =
                  editingSn === expense.sn;

                return (
                  <div
                    key={expense.sn}
                    className="p-4 space-y-4"
                  >

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-gray-400">
                          ID
                        </p>

                        <p className="font-semibold text-gray-800">
                          {expense.id}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">

                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                saveEdit(
                                  expense.sn
                                )
                              }
                              disabled={
                                loading
                              }
                              className="
                                p-2
                                rounded-md
                                bg-green-50
                                text-green-600
                                cursor-pointer
                                disabled:opacity-50
                              "
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              disabled={
                                loading
                              }
                              className="
                                p-2
                                rounded-md
                                bg-gray-50
                                text-gray-600
                                cursor-pointer
                              "
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  expense
                                )
                              }
                              className="
                                p-2
                                rounded-md
                                bg-blue-50
                                text-blue-600
                                cursor-pointer
                              "
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  expense.sn
                                )
                              }
                              disabled={
                                loading
                              }
                              className="
                                p-2
                                rounded-md
                                bg-red-50
                                text-red-600
                                cursor-pointer
                                disabled:opacity-50
                              "
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Expenses
                      </p>

                      {isEditing ? (
                        <input
                          type="number"
                          value={
                            editAmount
                          }
                          onChange={(e) =>
                            setEditAmount(
                              e.target
                                .value ===
                                ""
                                ? ""
                                : Number(
                                    e.target
                                      .value
                                  )
                            )
                          }
                          className="
                            w-full
                            h-10
                            px-3
                            border
                            border-gray-300
                            rounded-md
                            outline-none
                            focus:border-[#FFA726]
                          "
                        />
                      ) : (
                        <p className="font-semibold text-gray-800">
                          {expense.symbol ||
                            ""}

                          {
                            expense.add_expenses
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Remarks
                      </p>

                      {isEditing ? (
                        <SearchInput
                          options={categories.map(
                            (cat) => ({
                              id: cat.id,
                              value:
                                cat.expense_category,
                            })
                          )}
                          value={
                            editCategory ??
                            ""
                          }
                          onChange={
                            setEditCategory
                          }
                          placeholder="Select category..."
                          className="w-full"
                        />
                      ) : (
                        <p className="font-medium text-gray-700">
                          {
                            expense.expense_category
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Total Expenses
                      </p>

                      <p className="font-bold text-gray-800">
                        {expense.symbol ||
                          ""}

                        {
                          expense.total_expenses
                        }
                      </p>
                    </div>

                    {!isEditing && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 mb-2">
                            Attachments
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {renderReceipt(
                              expense
                            )}

                            {renderDocuments(
                              expense
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Added Date
                          </p>

                          <p className="text-sm text-gray-600">
                            {
                              expense.created_date
                            }
                          </p>
                        </div>
                      </>
                    )}

                    {/* MOBILE EDIT ATTACHMENTS */}

                    {isEditing && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">

                        <div className="flex items-center gap-2 mb-3">
                          <Paperclip className="w-4 h-4 text-gray-500" />

                          <span className="text-sm font-semibold text-gray-700">
                            Update Attachments
                          </span>
                        </div>

                        {renderEditAttachments()}

                        <div className="mt-3">
                          <p className="text-xs text-gray-400">
                            Added Date
                          </p>

                          <p className="text-sm text-gray-600">
                            {
                              expense.created_date
                            }
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              }
            )
          ) : (
            <div className="px-4 py-8 text-center text-gray-400">
              No expenses found.
            </div>
          )}

        </div>
      </div>

      {/* =====================================================
          IMAGE / PDF PREVIEW POPUP
      ===================================================== */}

      {previewFile && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            bg-black/75
            flex
            items-center
            justify-center
            p-3
            sm:p-6
          "
          onClick={closePreview}
        >

          <div
            className={`
              relative
              bg-white
              rounded-xl
              shadow-2xl
              overflow-hidden
              flex
              flex-col

              ${
                fullScreen
                  ? "w-full h-full rounded-none"
                  : "w-full max-w-5xl max-h-[94vh]"
              }
            `}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div
              className="
                shrink-0
                h-14
                px-3
                sm:px-4
                border-b
                border-gray-200
                flex
                items-center
                justify-between
                bg-white
              "
            >

              <div className="flex items-center gap-2 min-w-0">

                {isPdfFile(
                  previewFile
                ) ? (
                  <FileText
                    className="
                      w-5 h-5
                      text-red-500
                      shrink-0
                    "
                  />
                ) : (
                  <ImageIcon
                    className="
                      w-5 h-5
                      text-blue-500
                      shrink-0
                    "
                  />
                )}

                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-700
                    truncate
                    max-w-[180px]
                    sm:max-w-md
                  "
                  title={
                    previewFile.fileName
                  }
                >
                  {
                    previewFile.fileName
                  }
                </p>

              </div>

              <div className="flex items-center gap-1 shrink-0">

                {isImageFile(
                  previewFile
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      setFullScreen(
                        !fullScreen
                      )
                    }
                    className="
                      p-2
                      rounded-md
                      hover:bg-gray-100
                      text-gray-600
                      cursor-pointer
                    "
                    title={
                      fullScreen
                        ? "Exit full view"
                        : "View Full"
                    }
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
                  onClick={
                    closePreview
                  }
                  className="
                    p-2
                    rounded-md
                    hover:bg-gray-100
                    text-gray-600
                    cursor-pointer
                  "
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>
            </div>

            {/* CONTENT */}

            <div
              className={`
                flex
                items-center
                justify-center
                bg-gray-100
                overflow-auto

                ${
                  fullScreen
                    ? "flex-1"
                    : "min-h-[300px] max-h-[calc(94vh-3.5rem)]"
                }
              `}
            >

              {isImageFile(
                previewFile
              ) && (
                <div
                  className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    p-3
                    sm:p-6
                  "
                >
                  <img
                    src={
                      previewFile.url
                    }
                    alt={
                      previewFile.fileName
                    }
                    className={`
                      object-contain
                      rounded-md
                      shadow-sm

                      ${
                        fullScreen
                          ? "max-w-full max-h-full"
                          : "max-w-full max-h-[78vh]"
                      }
                    `}
                    onError={() => {
                      toast.error(
                        "Unable to load the image."
                      );
                    }}
                  />
                </div>
              )}

              {isPdfFile(
                previewFile
              ) && (
                <iframe
                  src={
                    previewFile.url
                  }
                  title={
                    previewFile.fileName
                  }
                  className="
                    w-full
                    h-[75vh]
                    sm:h-[80vh]
                    border-0
                  "
                />
              )}

              {!isImageFile(
                previewFile
              ) &&
                !isPdfFile(
                  previewFile
                ) && (
                  <div className="text-center p-8">

                    <FileText
                      className="
                        w-12 h-12
                        mx-auto
                        mb-3
                        text-gray-400
                      "
                    />

                    <p className="text-sm text-gray-600">
                      Preview is not available
                      for this file type.
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