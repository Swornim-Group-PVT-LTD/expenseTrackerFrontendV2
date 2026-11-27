"use client";

import { useTranslation } from "react-i18next";
import TableActionButton from "@/app/components/TableActionButton";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";

import {
  getSavingService,
  deleteSavingService,
  updateSavingService,
} from "@/app/services/savingService";
import { SavingResponse } from "@/app/types/savingType";
import { SavingCategoryResponse } from "@/app/types/catalolgueType/savingCatalogueType";
import { getSavingCategoriesService } from "@/app/services/catalogueServices/savingCatalogueService";
import SearchInput from "@/app/components/SearchInput";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";
import { useCurrency } from "@/app/context/CurrencyContext";

const selectionLimit = 100;

export default function SavingTable({
  refreshTrigger,
  filteredData,
  onSuccess,
  onDataLoad,
  selectedIds,
  onSelect,
  onSelectAll,
}: {
  refreshTrigger: number;
  filteredData?: SavingResponse[] | null;
  onSuccess?: () => void;
  onDataLoad?: (data: SavingResponse[]) => void;
  selectedIds: number[];
  onSelect: (row: SavingResponse, checked: boolean) => void;
  onSelectAll: (rows: SavingResponse[]) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState<SavingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingSn, setEditingSn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    add_saving: 0,
    saving_category: "",
    want_to_deduct_from_balance: false,
  });

  const [categories, setCategories] = useState<SavingCategoryResponse[]>([]);

  const { currency } = useCurrency();
  const { isVisible } = useBalanceVisibility();

  const fetchCategories = async () => {
    try {
      const data = await getSavingCategoriesService();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch saving categories:", err);
      toast.error(t("Failed to fetch saving categories"));
    }
  };

  const fetchSaving = async () => {
    setLoading(true);
    try {
      const data = await getSavingService();
      setSaving(data);
      onDataLoad && onDataLoad(data);
    } catch (error) {
      console.error("Error fetching Saving:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch all data if no filter is active
    if (filteredData) {
      setSaving(filteredData);
      setLoading(false);
    } else {
      fetchSaving();
    }
    fetchCategories();
  }, [refreshTrigger, filteredData]);

  // Start editing a row
  const startEdit = (item: any) => {
    setEditingSn(item.sn);
    setEditForm({
      add_saving: item.add_saving,
      saving_category: item.saving_category,
      want_to_deduct_from_balance: item.want_to_deduct_from_balance || false,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingSn(null);
    setEditForm({
      add_saving: 0,
      saving_category: "",
      want_to_deduct_from_balance: false,
    });
  };

  // Save update
  const saveEdit = async (sn: string) => {
    // Validate category
    const categoryExists = categories.some(
      (cat) =>
        cat.saving_category.toLowerCase() ===
        editForm.saving_category.toLowerCase(),
    );

    if (!categoryExists) {
      toast.error(t("Please select a valid category from the list"));
      return;
    }

    try {
      await updateSavingService(sn, {
        add_saving: editForm.add_saving,
        saving_category: editForm.saving_category,
        want_to_deduct_from_balance: editForm.want_to_deduct_from_balance,
      });

      onSuccess && onSuccess();
      toast.success(t("Saving updated successfully"));
      setSaving((prev) =>
        prev.map((item) =>
          item.sn === sn
            ? {
                ...item,
                add_saving: editForm.add_saving,
                saving_category: editForm.saving_category,
              }
            : item,
        ),
      );

      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Failed to update saving."));
    }
  };

  const handleDelete = async (sn: string) => {
    try {
      await deleteSavingService(sn);
      onSuccess && onSuccess();
      toast.success(t("saving deleted successfully"));
      setSaving(saving.filter((saving) => saving.sn !== sn));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Failed to delete saving."));
    }
  };

  const eligibleRows = saving.filter((row) =>
    !row.is_transfer && Number(row.transferable_amount) > 0,
  );
  const selectedIdSet = new Set(selectedIds);
  const selectedRows = eligibleRows.filter((row) => selectedIdSet.has(row.id));
  const selectedCount = selectedRows.length;
  const allChecked = eligibleRows.length > 0 && selectedCount === eligibleRows.length;
  const partiallyChecked = selectedCount > 0 && !allChecked;

  const selectAllCheckbox = () => (
    <input
      type="checkbox"
      ref={(input) => {
        if (input) input.indeterminate = partiallyChecked;
      }}
      checked={allChecked}
      disabled={loading || eligibleRows.length === 0}
      aria-label={t("Select all available savings")}
      title={eligibleRows.length > selectionLimit ? t("Select up to 100 savings entries") : undefined}
      onChange={() => {
        if (allChecked || selectedCount >= selectionLimit) {
          onSelectAll([]);
        } else {
          const remainingRows = eligibleRows.filter((row) => !selectedIdSet.has(row.id));
          onSelectAll([...selectedRows, ...remainingRows].slice(0, selectionLimit));
        }
      }}
      className="cursor-pointer rounded border-gray-300 accent-[#056455] disabled:cursor-not-allowed"
    />
  );

  const selectionCheckbox = (row: SavingResponse) =>
    !row.is_transfer && Number(row.transferable_amount) > 0 ? (
      <input
        type="checkbox"
        checked={selectedIdSet.has(row.id)}
        disabled={selectedIds.length >= selectionLimit && !selectedIdSet.has(row.id)}
        onChange={(event) => onSelect(row, event.target.checked)}
        aria-label={t("Select saving {{id}} from {{category}}", { id: row.id, category: row.saving_category })}
        className="mr-2 rounded border-gray-300"
      />
    ) : null;

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-surface hidden overflow-x-auto lg:block">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <Table striped className="ledger-table min-w-[800px]">
              {/* TableHead */}
              <TableHead className="text-lg">
                <TableRow>
                  <TableHeadCell>
                    <label className="inline-flex items-center gap-2">
                      {selectAllCheckbox()}
                      ID
                    </label>
                  </TableHeadCell>
                  <TableHeadCell>{t("Saving")}</TableHeadCell>
                  <TableHeadCell>{t("Deduct from balance")}</TableHeadCell>
                  <TableHeadCell>{t("Remarks")}</TableHeadCell>
                  <TableHeadCell>{t("Total Saving")}</TableHeadCell>
                  <TableHeadCell>{t("Created Date")}</TableHeadCell>
                  <TableHeadCell>{t("Action")}</TableHeadCell>
                </TableRow>
              </TableHead>

              {/* TableBody */}
              <TableBody className="divide-y">
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center font-medium text-gray-500"
                    >
                      <ClipLoader size={22} color="#000000" />
                    </TableCell>
                  </TableRow>
                ) : saving.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center font-medium text-gray-500"
                    >
                      {t("No Saving found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  saving.map((row) => (
                    <TableRow
                      key={row.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {selectionCheckbox(row)}
                        {row.id}
                      </TableCell>
                      <TableCell>
                        {editingSn === row.sn ? (
                          <>
                            {row.symbol || "NPR"}{" "}
                            <input
                              className="p-2 border rounded-md border-gray-300"
                              value={editForm.add_saving}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  add_saving: Number(e.target.value),
                                }))
                              }
                            />
                          </>
                        ) : (
                          maskAmount(row.is_transfer ? -Number(row.savings_deduction ?? row.add_saving) : row.add_saving, isVisible, currency)
                        )}
                      </TableCell>

                      <TableCell>
                        {editingSn === row.sn ? (
                          <input
                            type="checkbox"
                            checked={
                              editForm.want_to_deduct_from_balance || false
                            }
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                want_to_deduct_from_balance: e.target.checked,
                              }))
                            }
                          />
                        ) : (
                          <span>
                            {row.is_transfer ? `Credited ${maskAmount(row.add_saving, isVisible, currency)}` : row.want_to_deduct_from_balance ? t("Yes") : t("No")}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingSn === row.sn ? (
                          <SearchInput
                            options={categories.map((cat) => ({
                              id: cat.id,
                              value: cat.saving_category,
                            }))}
                            value={editForm.saving_category}
                            onChange={(value) =>
                              setEditForm((prev) => ({
                                ...prev,
                                saving_category: value,
                              }))
                            }
                            placeholder={t("Type saving category...")}
                            className="w-full sm:w-80"
                          />
                        ) : (
                          row.is_transfer && row.source_saving_id
                            ? `${row.remarks ?? row.saving_category} · Saving #${row.source_saving_id}`
                            : row.remarks ?? row.saving_category
                        )}
                      </TableCell>

                      <TableCell>
                        {maskAmount(row.total_saving, isVisible, currency)}
                      </TableCell>
                      <TableCell>{row.created_date}</TableCell>
                      <TableCell>
                        {editingSn === row.sn ? (
                          <>
                            <button
                              className="text-green-600 mr-2 cursor-pointer"
                              onClick={() => saveEdit(row.sn)}
                            >
                              {t("Save")}
                            </button>
                            <button
                              className="text-gray-600 cursor-pointer"
                              onClick={cancelEdit}
                            >
                              {t("Cancel")}
                            </button>
                          </>
                        ) : row.is_transfer ? null : (
                          <TableActionButton action="edit" onClick={() => startEdit(row)} />
                        )}
                        {!row.is_transfer && (
                          <TableActionButton action="delete" onClick={() => handleDelete(row.sn)} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* TOTAL SAVING BAR */}
                {saving.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div
                        className="flex justify-between items-center p-4 text-white font-semibold rounded-lg shadow mt-2"
                        style={{ backgroundColor: "#44eeaa" }}
                      >
                        <span>{t("Total Saving")}</span>
                        <span>
                          {maskAmount(
                            saving[saving.length - 1].total_saving,
                            isVisible,
                            currency,
                          )}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {!loading && eligibleRows.length > 0 && (
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {selectAllCheckbox()}
            {t("Select all available savings")}
          </label>
        )}
        {loading ? (
          <div className="text-center font-medium text-gray-500">
            <ClipLoader size={22} color="#000000" />
          </div>
        ) : saving.length === 0 ? (
          <div className="text-center font-medium text-gray-500">
            {t("No Saving found")}
          </div>
        ) : (
          saving.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col gap-2"
            >
              {/* Row 1: ID and Actions */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">
                  {selectionCheckbox(row)}
                  ID {row.id}
                </span>
                <div className="flex gap-1 text-xs font-bold">
                  {editingSn === row.sn ? (
                    <>
                      <button
                        onClick={() => saveEdit(row.sn)}
                        className="text-green-600 hover:underline"
                      >
                        {t("Save")}
                      </button>
                      <span className="text-gray-300">/</span>
                      <button
                        onClick={() => cancelEdit()}
                        className="text-gray-500 hover:underline"
                      >
                        {t("Cancel")}
                      </button>
                    </>
                  ) : row.is_transfer ? null : (
                    <>
                      <TableActionButton action="edit" onClick={() => startEdit(row)} />
                      <TableActionButton action="delete" onClick={() => handleDelete(row.sn)} />
                    </>
                  )}
                </div>
              </div>

              {/* Row 2: Category and Amount */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  {editingSn === row.sn ? (
                    <>
                      <SearchInput
                        options={categories.map((cat) => ({
                          id: cat.id,
                          value: cat.saving_category,
                        }))}
                        value={editForm.saving_category}
                        onChange={(value) =>
                          setEditForm((prev) => ({
                            ...prev,
                            saving_category: value,
                          }))
                        }
                        placeholder={t("Category...")}
                        className="w-full text-xs"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded text-[#FFAA00] focus:ring-[#FFAA00]"
                          checked={editForm.want_to_deduct_from_balance}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              want_to_deduct_from_balance: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-[10px] text-gray-500 font-medium leading-none">
                          {t("Deduct from balance")}
                        </span>
                      </label>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {row.is_transfer ? row.remarks : row.saving_category}
                      {row.want_to_deduct_from_balance && (
                        <span className="text-[10px] ml-1 text-blue-500 font-medium">
                          {t("(Deducted)")}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  {editingSn === row.sn ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {row.symbol || "NPR"}
                      </span>
                      <input
                        type="number"
                        className="w-24 p-1 text-sm border rounded focus:ring-1 focus:ring-[#FFAA00]"
                        value={editForm.add_saving}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            add_saving: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-gray-800">
                      {row.is_transfer ? t("Transferred to balance") : t("Saving")} {maskAmount(row.add_saving, isVisible, currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Date and Total */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {row.created_date}
                </span>
                <span className="text-xs font-bold text-gray-700">
                  {t("Total Saving")}{" "}
                  {maskAmount(row.total_saving, isVisible, currency)}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Total Saving Card */}
        {saving.length > 0 && (
          <div
            className="p-4 text-white font-semibold rounded-lg shadow"
            style={{ backgroundColor: "#44eeaa" }}
          >
            <div className="flex justify-between items-center">
              <span>{t("Total Saving")}</span>
              <span>
                {maskAmount(
                  saving[saving.length - 1].total_saving,
                  isVisible,
                  currency,
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
