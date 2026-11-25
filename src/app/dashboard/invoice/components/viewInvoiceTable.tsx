"use client";

import { calculateInvoiceTotals } from "@/app/utils/invoiceTotals";
import React, { useCallback, useEffect, useState } from "react";
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
  Eye,
  Pencil,
  Trash2,
  Save,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getInvoiceService,
  getInvoiceBySnService,
  updateInvoiceStatusService,
  deleteInvoiceService,
} from "@/app/services/invoiceService";
import type {
  InvoiceResponse,
  InvoiceStatus,
} from "@/app/types/invoiceType";

interface ViewInvoiceTableProps {
  filteredData?: InvoiceResponse[] | null;
  isFilterActive?: boolean;
  onDataChange?: () => void;
  refreshTrigger?: number;
  onSuccess?: () => void;
  onDataLoad?: (data: InvoiceResponse[]) => void;
  onViewInvoice: (invoice: InvoiceResponse) => void;
}

const ViewInvoiceTable: React.FC<ViewInvoiceTableProps> = ({
  filteredData,
  isFilterActive = false,
  onDataChange,
  refreshTrigger = 0,
  onSuccess,
  onDataLoad,
  onViewInvoice,
}) => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSn, setDeletingSn] = useState<string | number | null>(null);
  const [updatingStatusSn, setUpdatingStatusSn] = useState<
    string | number | null
  >(null);
  const [viewLoadingSn, setViewLoadingSn] = useState<
    string | number | null
  >(null);

  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, InvoiceStatus>
  >({});

  const getInvoiceSn = (
    invoice: InvoiceResponse
  ): string | number | null => invoice.sn ?? invoice.id ?? null;

  const getStatus = (invoice: InvoiceResponse): InvoiceStatus => {
    const status = String(invoice.status ?? invoice.Status ?? "Active")
      .trim()
      .toLowerCase();

    if (status === "completed") return "Completed";
    if (status === "rejected") return "Rejected";
    return "Active";
  };

  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case "Completed":
        return "border-green-200 bg-green-50 text-green-700";
      case "Rejected":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
  };

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const response: unknown = await getInvoiceService();

      const responseObject =
        response && typeof response === "object"
          ? (response as Record<string, unknown>)
          : {};

      const responseData =
        responseObject.data && typeof responseObject.data === "object"
          ? (responseObject.data as Record<string, unknown>)
          : {};

      let rawInvoiceData: unknown;

      if (Array.isArray(response)) {
        rawInvoiceData = response;
      } else if (Array.isArray(responseObject.data)) {
        rawInvoiceData = responseObject.data;
      } else if (Array.isArray(responseData.data)) {
        rawInvoiceData = responseData.data;
      } else {
        rawInvoiceData = [];
      }

      const invoiceData = Array.isArray(rawInvoiceData)
        ? [...(rawInvoiceData as InvoiceResponse[])].sort(
            (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0),
          )
        : [];

      setInvoices(invoiceData);
      onDataLoad?.(invoiceData);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, [onDataLoad]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices, refreshTrigger]);

  const getInvoiceTotal = (invoice: InvoiceResponse): number => {
    const savedTotal = Number(
      invoice.grand_total ?? invoice.total_amount
    );

    if (
      (invoice.grand_total !== undefined ||
        invoice.total_amount !== undefined) &&
      Number.isFinite(savedTotal)
    ) {
      return savedTotal;
    }

    const items =
      invoice.items ??
      invoice.invoice_items ??
      invoice.invoiceItems ??
      invoice.details ??
      [];

    const subtotal = items.reduce((sum, item) => {
      const cost = Number(
        item.unit_cost ?? item.unit_price ?? item.rate ?? 0
      );
      const quantity = Number(item.quantity ?? item.qty ?? 0);

      return (
        sum +
        (Number.isFinite(cost) ? cost : 0) *
        (Number.isFinite(quantity) ? quantity : 0)
      );
    }, 0);

    return calculateInvoiceTotals(
      invoice.subtotal != null ? Number(invoice.subtotal) : subtotal,
      Number(invoice.discount_amount ?? 0),
      invoice.discount_type ?? null,
      Number(invoice.tax_percentage ?? 0),
      Number(invoice.shipping_fee ?? 0),
    ).total;
  };

  const formatCurrency = (
    amount: number,
    currency?: InvoiceResponse["currency"]
  ): string => {
    let symbol = "Rs.";

    if (typeof currency === "string" && currency.trim()) {
      symbol = currency;
    } else if (currency && typeof currency === "object") {
      symbol = currency.symbol || currency.currency || "Rs.";
    }

    return `${symbol} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleUpdateStatus = async (
    invoice: InvoiceResponse
  ): Promise<void> => {
    const sn = getInvoiceSn(invoice);

    if (sn === null) {
      toast.error("Invoice ID is missing.");
      return;
    }

    const key = String(sn);
    const currentStatus = getStatus(invoice);
    const selectedStatus = selectedStatuses[key] ?? currentStatus;

    if (selectedStatus === currentStatus) return;

    try {
      setUpdatingStatusSn(sn);

      await updateInvoiceStatusService(sn, selectedStatus);

      setInvoices((previous) =>
        previous.map((item) =>
          String(getInvoiceSn(item)) === key
            ? { ...item, status: selectedStatus, Status: selectedStatus }
            : item
        )
      );

      setSelectedStatuses((previous) => {
        const updated = { ...previous };
        delete updated[key];
        return updated;
      });

      toast.success("Invoice status updated successfully.");
      onDataChange?.();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update invoice status:", error);
      toast.error("Failed to update invoice status.");
    } finally {
      setUpdatingStatusSn(null);
    }
  };

  const handleDeleteInvoice = async (
    invoice: InvoiceResponse
  ): Promise<void> => {
    const sn = getInvoiceSn(invoice);

    if (sn === null) {
      toast.error("Invoice ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoice.invoice_number || sn
      }?`
    );

    if (!confirmed) return;

    try {
      setDeletingSn(sn);

      await deleteInvoiceService(sn);

      setInvoices((previous) =>
        previous.filter(
          (item) => String(getInvoiceSn(item)) !== String(sn)
        )
      );

      toast.success("Invoice deleted successfully.");
      onDataChange?.();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice.");
    } finally {
      setDeletingSn(null);
    }
  };

  const handleViewInvoice = async (
    invoice: InvoiceResponse
  ): Promise<void> => {
    const sn = getInvoiceSn(invoice);

    if (sn === null) {
      onViewInvoice(invoice);
      return;
    }

    try {
      setViewLoadingSn(sn);

      const response: unknown = await getInvoiceBySnService(sn);

      const responseObject =
        response && typeof response === "object"
          ? (response as Record<string, unknown>)
          : {};

      const responseData =
        responseObject.data && typeof responseObject.data === "object"
          ? (responseObject.data as Record<string, unknown>)
          : {};

      const fetchedInvoice: unknown =
        responseData.data ??
        responseData.invoice ??
        responseObject.invoice ??
        responseObject.data ??
        response;

      const normalizedInvoice: InvoiceResponse =
        fetchedInvoice && typeof fetchedInvoice === "object"
          ? (fetchedInvoice as InvoiceResponse)
          : invoice;

      onViewInvoice(normalizedInvoice);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      toast.error("Could not load invoice details.");
    } finally {
      setViewLoadingSn(null);
    }
  };

  const renderStatusEditor = (invoice: InvoiceResponse) => {
    const sn = getInvoiceSn(invoice);
    const currentStatus = getStatus(invoice);
    const key = sn === null ? "" : String(sn);
    const selectedStatus = key
      ? selectedStatuses[key] ?? currentStatus
      : currentStatus;

    return (
      <select
        aria-label={`Status for invoice ${invoice.invoice_number || sn || ""
          }`}
        value={selectedStatus}
        disabled={sn === null || updatingStatusSn !== null}
        onChange={(event) => {
          if (sn === null) return;

          setSelectedStatuses((previous) => ({
            ...previous,
            [String(sn)]: event.target.value as InvoiceStatus,
          }));
        }}
        className={`min-w-[125px] rounded-lg border px-2.5 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#14383F]/20 disabled:opacity-60 ${getStatusColor(
          selectedStatus
        )}`}
      >
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Rejected">Rejected</option>
      </select>
    );
  };

  const renderInvoiceActions = (invoice: InvoiceResponse) => {
    const sn = getInvoiceSn(invoice);
    const key = sn === null ? "" : String(sn);
    const currentStatus = getStatus(invoice);
    const selectedStatus = key
      ? selectedStatuses[key] ?? currentStatus
      : currentStatus;
    const hasStatusChanged = selectedStatus !== currentStatus;

    return (
      <div className="flex items-center justify-center gap-3">
        {hasStatusChanged && (
          <button
            type="button"
            onClick={() => void handleUpdateStatus(invoice)}
            disabled={sn === null || updatingStatusSn !== null}
            title="Save Status"
            aria-label="Save Status"
            className="rounded-md p-1 text-green-600 transition hover:bg-green-50 hover:text-green-800 disabled:opacity-50"
          >
            {updatingStatusSn === sn ? (
              <ClipLoader size={16} color="#16a34a" />
            ) : (
              <Save size={18} />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleViewInvoice(invoice)}
          disabled={viewLoadingSn === sn}
          title="View Invoice"
          aria-label="View Invoice"
          className="rounded-md p-1 text-[#14383F] hover:bg-gray-100 disabled:opacity-50"
        >
          {viewLoadingSn === sn ? (
            <ClipLoader size={16} color="#14383F" />
          ) : (
            <Eye size={18} />
          )}
        </button>

        {sn !== null && getStatus(invoice) === "Active" && (
          <button
            type="button"
            onClick={() => {
              window.location.href = `/dashboard/invoice/edit/${encodeURIComponent(
                String(sn)
              )}`;
            }}
            title="Edit Invoice"
            aria-label="Edit Invoice"
            className="rounded-md p-1 text-blue-600 hover:bg-blue-50"
          >
            <Pencil size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleDeleteInvoice(invoice)}
          disabled={deletingSn !== null}
          title="Delete Invoice"
          aria-label="Delete Invoice"
          className="rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deletingSn === sn ? (
            <ClipLoader size={16} color="#dc2626" />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>
    );
  };

  const displayInvoices =
    isFilterActive && Array.isArray(filteredData)
      ? filteredData
      : invoices;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          Total invoices:{" "}
          <span className="font-bold text-[#14383F]">
            {displayInvoices.length}
          </span>
        </div>
      </div>

      <div className="table-surface overflow-hidden bg-white">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <ClipLoader size={36} color="#14383F" />
          </div>
        ) : displayInvoices.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <FileText size={38} className="mb-3 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-700">
              No invoices found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isFilterActive
                ? "Try changing your filters to find invoices."
                : "Your invoices will appear here once they have been created."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table hoverable className="ledger-table min-w-[840px]">
                <TableHead>
                  <TableRow>
                    <TableHeadCell>S.N.</TableHeadCell>
                    <TableHeadCell>Invoice Number</TableHeadCell>
                    <TableHeadCell>Purchase Order</TableHeadCell>
                    <TableHeadCell>Bill To</TableHeadCell>
                    <TableHeadCell>Total</TableHeadCell>
                    <TableHeadCell>Invoice Date</TableHeadCell>
                    <TableHeadCell>Due Date</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">
                      Action
                    </TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {displayInvoices.map((invoice, index) => {
                    const sn = getInvoiceSn(invoice);

                    return (
                      <TableRow
                        key={String(sn ?? invoice.invoice_number ?? index)}
                        className="bg-white"
                      >
                        <TableCell className="whitespace-nowrap text-gray-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-[#14383F]">
                          {invoice.invoice_number || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice.purchase_order || "—"}
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="block truncate">
                            {invoice.bill_to || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">
                          {formatCurrency(
                            getInvoiceTotal(invoice),
                            invoice.currency
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice.invoice_date || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice.due_date || "—"}
                        </TableCell>
                        <TableCell>{renderStatusEditor(invoice)}</TableCell>
                        <TableCell>{renderInvoiceActions(invoice)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {displayInvoices.map((invoice, index) => {
                const sn = getInvoiceSn(invoice);
                const key = sn === null ? "" : String(sn);
                const currentStatus = getStatus(invoice);
                const selectedStatus = key
                  ? selectedStatuses[key] ?? currentStatus
                  : currentStatus;
                const hasStatusChanged =
                  selectedStatus !== currentStatus;

                return (
                  <div
                    key={String(sn ?? invoice.invoice_number ?? index)}
                    className="rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Invoice {index + 1}
                        </p>
                        <h3 className="mt-1 break-words font-bold text-[#14383F]">
                          {invoice.invoice_number || "—"}
                        </h3>
                        <p className="mt-1 break-words text-sm text-gray-500">
                          PO: {invoice.purchase_order || "—"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="mt-1 font-bold text-[#14383F]">
                          {formatCurrency(
                            getInvoiceTotal(invoice),
                            invoice.currency
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Bill To</p>
                        <p className="mt-1 break-words font-medium">
                          {invoice.bill_to || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Invoice Date</p>
                        <p className="mt-1 font-medium">
                          {invoice.invoice_date || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="mt-1 font-medium">
                          {invoice.due_date || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="mt-1">
                          {renderStatusEditor(invoice)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-gray-100 pt-3">
                      {hasStatusChanged && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(invoice)}
                          disabled={
                            sn === null || updatingStatusSn !== null
                          }
                          title="Save Status"
                          aria-label="Save Status"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 disabled:opacity-50"
                        >
                          {updatingStatusSn === sn ? (
                            <ClipLoader size={14} color="#16a34a" />
                          ) : (
                            <Save size={17} />
                          )}
                          Save
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleViewInvoice(invoice)}
                        disabled={viewLoadingSn === sn}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#14383F] disabled:opacity-50"
                      >
                        {viewLoadingSn === sn ? (
                          <ClipLoader size={14} color="#14383F" />
                        ) : (
                          <Eye size={17} />
                        )}
                        View
                      </button>

                      {sn !== null && getStatus(invoice) === "Active" && (
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `/dashboard/invoice/edit/${encodeURIComponent(
                              String(sn)
                            )}`;
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600"
                        >
                          <Pencil size={17} />
                          Edit
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleDeleteInvoice(invoice)}
                        disabled={deletingSn !== null}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 disabled:opacity-50"
                      >
                        {deletingSn === sn ? (
                          <ClipLoader size={14} color="#dc2626" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewInvoiceTable;
