"use client";

import { useTranslation } from "react-i18next";
import TableActionButton from "@/app/components/TableActionButton";
import React, { useState, useEffect } from "react";
import { IncomeCategoryResponse } from "../../../../types/catalolgueType/incomeCatalogueType";

import { ClipLoader } from "react-spinners";

import { toast } from "react-toastify";
import {
  deleteIncomeCategoryService,
  getIncomeCategoriesService,
  updateIncomeCategoryService,
} from "@/app/services/catalogueServices/incomeCatalogueService";

export default function IncomeCatalogueTable({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<IncomeCategoryResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ income_category: "" });

  // Fetch income categories from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const categories = await getIncomeCategoriesService();
      console.log("Fetched income categories:", categories);
      setData(categories);
    } catch (err) {
      console.error("Failed to fetch income categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // Filter data based on search input
  const filteredData = data.filter(
    (item) =>
      item.income_category?.toLowerCase().includes(search.toLowerCase()) ||
      item.static_value?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteIncomeCategoryService(id);
      toast.success(t("Income category deleted successfully"));
      fetchData(); // Refresh data after deletion
    } catch (err: any) {
      toast.error(err);
    }
  };

  // Start editing a row
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ income_category: item.income_category });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ income_category: "" });
  };

  // Save update
  const saveEdit = async (id: number) => {
    try {
      const updated = await updateIncomeCategoryService(id, {
        static_value: "INCOME",
        income_category: editForm.income_category,
        additional_value1: null,
        additional_value2: null,
        additional_value3: null,
        additional_value4: null,
      });

      fetchData(); // Refresh data after update
      toast.success(t("Income category updated successfully"));

      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  return (
    <>
      {/* Search Field */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search...")}
          className="px-3 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Desktop Table View */}
      <div className="table-surface mt-4 hidden w-full overflow-x-auto lg:block">
        <table className="ledger-table min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                ID
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                {t("Added Date")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                {t("Static Data")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                {t("Income Category")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                {t("Action")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={100} className="text-center py-4">
                  <ClipLoader size={22} color="#000000" />
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {item.created_date}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.sn}</td>

                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingId === item.id ? (
                      <input
                        className="border p-1"
                        value={editForm.income_category}
                        type="string"
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            income_category: String(e.target.value),
                          }))
                        }
                      />
                    ) : (
                      item.income_category
                    )}
                  </td>

                  <td className="px-4 py-2 text-sm">
                    <div className="flex justify-end gap-2">
                      <span className="text-green-500 cursor-pointer hover:underline">
                        {editingId === item.id ? (
                          <>
                            <button
                              className="text-green-600 mr-2 cursor-pointer hover:underline"
                              onClick={() => saveEdit(item.id)}
                            >
                              {t("Save")}
                            </button>
                            <button
                              className="text-gray-600 cursor-pointer hover:underline"
                              onClick={cancelEdit}
                            >
                              {t("Cancel")}
                            </button>
                          </>
                        ) : (
                          <TableActionButton action="edit" onClick={() => startEdit(item)} />
                        )}
                      </span>
                      <TableActionButton action="delete" onClick={() => handleDelete(item.id)} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                  {t("No records found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 mt-4">
        {loading ? (
          <div className="text-center font-medium text-gray-500">
            <ClipLoader size={22} color="#000000" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center font-medium text-gray-500">
            {t("No records found")}
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">
                  ID {item.id}
                </span>
                <div className="flex gap-2 text-xs font-bold">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="text-green-600 hover:underline"
                      >
                        {t("Save")}
                      </button>
                      <span className="text-gray-300">/</span>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:underline"
                      >
                        {t("Cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <TableActionButton action="edit" onClick={() => startEdit(item)} />
                      <TableActionButton action="delete" onClick={() => handleDelete(item.id)} />
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Category:")}</span>
                  {editingId === item.id ? (
                    <input
                      className="w-32 p-1 text-sm border rounded focus:ring-1 focus:ring-[#FFAA00]"
                      value={editForm.income_category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          income_category: String(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <span className="font-semibold">{item.income_category}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Static Data:")}</span>
                  <span className="font-semibold">{item.sn}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                  <span>{t("Created:")}{" "} {item.created_date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
