"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, } from "flowbite-react";
import { ClipLoader } from "react-spinners";
import { Eye, Pencil, Trash2, X, Save, FileText, } from "lucide-react";
import { toast } from "react-toastify";
import { getInvoiceService, getInvoiceBySnService, updateInvoiceService } from "@/app/services/invoiceService";
import type { InvoiceResponse } from "@/app/types/invoiceType";
import InvoiceTemplate from "../components/viewInvoiceTemplate";

interface InvoiceTableProps {
  filteredData?: InvoiceResponse[];
  isFilterActive?: boolean;
  onDataChange?: () => void;
  refreshTrigger?: number;
  onSuccess?: () => void;
  onDataLoad?: (data: InvoiceResponse[]) => void;
  onViewInvoice?: (invoice: InvoiceResponse) => void;
}

type ExtendedInvoice = Omit<InvoiceResponse, "currency"> & {
  status?: string;
  Status?: string;
  currency?: string | {
    currency?: string;
    symbol?: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Normalizes a direct invoice or common API response wrappers into
 * the InvoiceResponse shape expected by InvoiceTemplate.
 */

const normalizeInvoiceResponse = (response: unknown): InvoiceResponse => {
  if (!isRecord(response)) {
    throw new Error("Invalid invoice response.");
  }
  let data: Record<string, unknown> = response;
  for (let depth = 0; depth < 3; depth += 1) {
    if (isRecord(data.invoice)) {
      data = data.invoice;
      continue;
    }
    if (isRecord(data.data)) {
      data = data.data;
      continue;
    }
    break;
  }
  const items =
    (Array.isArray(data.items) ? data.items : undefined) ??
    (Array.isArray(data.invoice_items) ? data.invoice_items : undefined) ??
    (Array.isArray(data.invoiceItems) ? data.invoiceItems : undefined) ??
    (Array.isArray(data.details) ? data.details : undefined) ??
    [];
  return { ...data, items } as InvoiceResponse;
};

export default function InvoiceTable({
  filteredData,
  isFilterActive = false,
  onDataChange,
  refreshTrigger,
  onSuccess,
  onDataLoad,
}: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [editingSn, setEditingSn] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] =
    useState<InvoiceResponse | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editPurchaseOrder, setEditPurchaseOrder] = useState("");
  const [editBillTo, setEditBillTo] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotesPaymentTerms, setEditNotesPaymentTerms] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  // Normalize invoice serial numbers safely.
  const getInvoiceSn = (invoice: InvoiceResponse): string | null => {
    if (invoice.sn === undefined || invoice.sn === null) {
      return null;
    }
    return String(invoice.sn);
  };
  const loadInvoices = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getInvoiceService();
      const result = Array.isArray(data) ? data : [];
      setInvoices(result);
      onDataLoad?.(result);
    } catch (error: unknown) {
      console.error("Failed to fetch invoices:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch invoices."
      );
    } finally {
      setFetching(false);
    }
  }, [onDataLoad]);
  useEffect(() => {
    if (isFilterActive) {
      setFetching(false);
      return;
    }
    void loadInvoices();
  }, [isFilterActive, loadInvoices]);
  useEffect(() => {
    if (refreshTrigger !== undefined && !isFilterActive) {
      void loadInvoices();
    }
  }, [refreshTrigger, isFilterActive, loadInvoices]);
  const dataToDisplay = isFilterActive
    ? filteredData ?? []
    : invoices;
  const isLoading = fetching && !isFilterActive;
  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const getStatus = (invoice: InvoiceResponse) => {
    const item = invoice as ExtendedInvoice;
    return item.status || item.Status || "Active";
  };
  const renderStatus = (invoice: InvoiceResponse) => {
    const status = getStatus(invoice);
    const normalizedStatus = status.toLowerCase();
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      sent: "bg-blue-100 text-blue-700",
      overdue: "bg-red-100 text-red-700",
      draft: "bg-gray-100 text-gray-700",
      active: "bg-orange-100 text-orange-700",
    };
    return (
      <span
        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colors[normalizedStatus] ??
          "bg-orange-100 text-orange-700"
          }`}
      >
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  };
  const getCurrencyDisplay = (invoice: InvoiceResponse) => {
    const item = invoice as ExtendedInvoice;
    const currencyValue = item.currency;
    if (typeof currencyValue === "string") {
      return currencyValue || "—";
    }
    if (currencyValue?.symbol || currencyValue?.currency) {
      return `${currencyValue.symbol ?? ""} ${currencyValue.currency ?? ""}`.trim();
    }
    return invoice.currency_id
      ? `ID: ${invoice.currency_id}`
      : "—";
  };
  // FIX: invoice.sn may be string, number, or undefined.
  const startEdit = (invoice: InvoiceResponse) => {
    const sn = getInvoiceSn(invoice);
    if (sn === null) {
      toast.error("Invoice serial number is missing.");
      return;
    }
    setEditingSn(sn);
    setEditInvoiceNumber(invoice.invoice_number || "");
    setEditPurchaseOrder(invoice.purchase_order || "");
    setEditBillTo(invoice.bill_to || "");
    setEditInvoiceDate(invoice.invoice_date || "");
    setEditDueDate(invoice.due_date || "");
    setEditNotesPaymentTerms(
      invoice.notes_payment_terms || ""
    );
    setViewInvoice(null);
  };
  const cancelEdit = () => {
    setEditingSn(null);
    setEditInvoiceNumber("");
    setEditPurchaseOrder("");
    setEditBillTo("");
    setEditInvoiceDate("");
    setEditDueDate("");
    setEditNotesPaymentTerms("");
  };
  const saveEdit = async (sn: string) => {
    if (!editInvoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }
    if (!editInvoiceDate) {
      toast.error("Invoice date is required.");
      return;
    }
    if (!editDueDate) {
      toast.error("Due date is required.");
      return;
    }
    try {
      setLoading(true);
      await updateInvoiceService(sn, {
        invoice_number: editInvoiceNumber,
        purchase_order: editPurchaseOrder,
        bill_to: editBillTo,
        invoice_date: editInvoiceDate,
        due_date: editDueDate,
        notes_payment_terms: editNotesPaymentTerms,
      });
      toast.success("Invoice updated successfully.");
      cancelEdit();
      if (isFilterActive) {
        onDataChange?.();
      } else {
        await loadInvoices();
      }
      onSuccess?.();
    } catch (error: unknown) {
      console.error("Failed to update invoice:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update invoice."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleView = async (sn: string) => {
    try {
      setLoading(true);
      const response: unknown = await getInvoiceBySnService(sn);
      const invoice = normalizeInvoiceResponse(response);
      setViewInvoice(invoice);
    } catch (error: unknown) {
      console.error("Failed to fetch invoice:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch invoice."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = (sn: string) => {
    toast.info(
      `Invoice ${sn}: connect your deleteInvoiceService to enable deletion.`
    );
  };
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewInvoice(null);
        cancelEdit();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  const renderEditForm = (invoice: InvoiceResponse) => (
    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-800">
          Update Invoice
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Invoice Number",
            value: editInvoiceNumber,
            setter: setEditInvoiceNumber,
            type: "text",
          },
          {
            label: "Purchase Order",
            value: editPurchaseOrder,
            setter: setEditPurchaseOrder,
            type: "text",
          },
          {
            label: "Bill To",
            value: editBillTo,
            setter: setEditBillTo,
            type: "text",
          },
          {
            label: "Invoice Date",
            value: editInvoiceDate,
            setter: setEditInvoiceDate,
            type: "date",
          },
          {
            label: "Due Date",
            value: editDueDate,
            setter: setEditDueDate,
            type: "date",
          },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              {field.label}
            </label>
            <input
              type={field.type}
              value={field.value}
              onChange={(event) =>
                field.setter(event.target.value)
              }
              className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
            Notes / Payment Terms
          </label>
          <textarea
            value={editNotesPaymentTerms}
            onChange={(event) =>
              setEditNotesPaymentTerms(event.target.value)
            }
            rows={2}
            className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={cancelEdit}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          <X size={15} />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const sn = getInvoiceSn(invoice);
            if (sn === null) {
              toast.error(
                "Invoice serial number is missing."
              );
              return;
            }
            void saveEdit(sn);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? (
            <ClipLoader size={13} color="#ffffff" />
          ) : (
            <Save size={15} />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
  const renderEmptyState = (mobile = false) => (
    <div
      className={`flex flex-col items-center justify-center text-center ${mobile
        ? "rounded-xl border border-gray-100 bg-white px-4 py-12"
        : "py-16"
        }`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <FileText className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-700">
        No data found
      </p>
      <p className="mt-1 text-sm text-gray-400">
        No invoices are available to display.
      </p>
    </div>
  );
  const renderInvoiceActions = (invoice: InvoiceResponse) => {
    const sn = getInvoiceSn(invoice);
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (sn === null) {
              toast.error("Invoice serial number is missing.");
              return;
            }
            void handleView(sn);
          }}
          disabled={loading || sn === null}
          title="Preview Invoice"
          aria-label="Preview Invoice"
          className="text-[#14383F] transition hover:text-blue-700 disabled:opacity-50"
        >
          <Eye size={18} />
        </button>
        <button
          type="button"
          onClick={() => startEdit(invoice)}
          disabled={sn === null}
          title="Edit Invoice"
          aria-label="Edit Invoice"
          className="text-orange-500 transition hover:text-orange-700 disabled:opacity-50"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (sn === null) {
              toast.error(
                "Invoice serial number is missing."
              );
              return;
            }
            handleDelete(sn);
          }}
          disabled={loading || sn === null}
          title="Delete Invoice"
          aria-label="Delete Invoice"
          className="text-red-500 transition hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };
  if (viewInvoice) {
    return (
      <InvoiceTemplate
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        mode="page"
      />
    );
  }

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden w-full overflow-x-auto lg:block">
        <Table striped hoverable>
          <TableHead>
            <TableRow>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                S.N.
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Invoice Number
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Purchase Order
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Bill To
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Currency
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Invoice Date
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Due Date
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Status
              </TableHeadCell>
              <TableHeadCell className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">
                Action
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex justify-center py-12">
                    <ClipLoader
                      size={24}
                      color="#f97316"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : dataToDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              dataToDisplay.map((invoice, index) => {
                const sn = getInvoiceSn(invoice);
                const isEditing =
                  editingSn !== null &&
                  sn !== null &&
                  editingSn === sn;
                return (
                  <React.Fragment
                    key={sn ?? `invoice-${index}`}
                  >
                    <TableRow>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-sm font-semibold text-gray-800">
                          {invoice.invoice_number}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {invoice.purchase_order || "—"}
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[200px] truncate text-sm text-gray-700"
                          title={invoice.bill_to || ""}
                        >
                          {invoice.bill_to || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          {getCurrencyDisplay(invoice)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.invoice_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.due_date)}
                      </TableCell>
                      <TableCell>
                        {renderStatus(invoice)}
                      </TableCell>
                      <TableCell>
                        {renderInvoiceActions(invoice)}
                      </TableCell>
                    </TableRow>
                    {isEditing && (
                      <TableRow>
                        <TableCell colSpan={9}>
                          {renderEditForm(invoice)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
