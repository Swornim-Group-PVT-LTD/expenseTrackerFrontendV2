"use client";

import { useTranslation } from "react-i18next";
import TableActionButton from "@/app/components/TableActionButton";
import React, { useState, useEffect } from "react";
import { ListChecks } from "lucide-react";
import ThresholdDialog from "./ThresholdDialog";
import { getThresholdsService, deleteThresholdService, updateThresholdService } from "@/app/services/thresholdService";
import { ThresholdResponse } from "@/app/types/thresholdType";

interface ViewThresholdModalProps {
    isOpen: boolean;
    onClose: () => void;
    refreshTrigger?: number;
    onSuccess?: () => void;
}

const ViewThresholdModal = ({ isOpen, onClose, refreshTrigger, onSuccess }: ViewThresholdModalProps) => {
  const { t } = useTranslation();
    const [thresholds, setThresholds] = useState<ThresholdResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
    const [editingSn, setEditingSn] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        expense_threshold_amount: 0,
        frequency: "Monthly" as "Monthly" | "Yearly",
        isEnable: true,
    });

    const fetchThresholds = async () => {
        try {
            setLoading(true);
            const data = await getThresholdsService();
            setThresholds(data);
        } catch (error: any) {
            setFeedback({ message: error.message || t("Failed to fetch thresholds"), error: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchThresholds();
        }
    }, [isOpen, refreshTrigger]);

    const close = () => {
        setFeedback(null);
        onClose();
    };

    // Start editing a row
    const startEdit = (threshold: ThresholdResponse) => {
        setEditingSn(threshold.sn);
        setEditForm({
            expense_threshold_amount: threshold.expense_threshold_amount,
            frequency: threshold.frequency,
            isEnable: threshold.isEnable,
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingSn(null);
        setEditForm({
            expense_threshold_amount: 0,
            frequency: "Monthly",
            isEnable: true,
        });
    };

    // Save update
    const saveEdit = async (sn: string) => {
        try {
            // Check if trying to enable this threshold when another one of the SAME frequency is already enabled
            if (editForm.isEnable) {
                const otherEnabledThreshold = thresholds.find(
                    t => t.sn !== sn && t.isEnable === true && t.frequency === editForm.frequency
                );

                if (otherEnabledThreshold) {
                    setFeedback({ message: t("Disable the existing {{period}} threshold first.", { period: t(editForm.frequency) }), error: true });
                    return;
                }
            }

            await updateThresholdService(sn, editForm);
            setFeedback({ message: t("Threshold updated successfully"), error: false });
            setThresholds((prev) =>
                prev.map((item) =>
                    item.sn === sn
                        ? {
                            ...item,
                            expense_threshold_amount: editForm.expense_threshold_amount,
                            frequency: editForm.frequency,
                            isEnable: editForm.isEnable,
                        }
                        : item
                )
            );
            cancelEdit();
            onSuccess && onSuccess(); // Trigger parent refresh
        } catch (error: any) {
            setFeedback({ message: error.message || t("Failed to update threshold"), error: true });
        }
    };

    const handleDelete = async (sn: string) => {

        try {
            await deleteThresholdService(sn);
            setFeedback({ message: t("Threshold deleted successfully"), error: false });
            fetchThresholds(); // Refresh the list
            onSuccess && onSuccess(); // Trigger parent refresh
        } catch (error: any) {
            setFeedback({ message: error.message || t("Failed to delete threshold"), error: true });
        }
    };

    // Format date safely
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return t("Invalid Date");
            }
            return date.toLocaleDateString();
        } catch (error) {
            return t("Invalid Date");
        }
    };

    if (!isOpen) return null;

    return (
        <ThresholdDialog title={t("View Expense Thresholds")} icon={ListChecks} onClose={close} wide>
            <div className="@container space-y-4 p-5 sm:p-6">
                    {feedback && (
                        <p role={feedback.error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${feedback.error ? "border-red-200 bg-red-50 text-red-800" : "border-teal-200 bg-teal-50 text-teal-900"}`}>
                            {feedback.message}
                        </p>
                    )}
                    {loading ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                            <p className="text-gray-500">{t("Loading thresholds...")}</p>
                        </div>
                    ) : thresholds.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                            <p className="text-gray-500">{t("No thresholds found. Add one to get started!")}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="table-surface hidden overflow-x-auto @min-[40rem]:block">
                                <table className="ledger-table w-full min-w-[640px] border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-4 py-2 text-left">ID</th>
                                            <th className="px-4 py-2 text-left">{t("Amount")}</th>
                                            <th className="px-4 py-2 text-left">{t("Frequency")}</th>
                                            <th className="px-4 py-2 text-left">{t("Status")}</th>
                                            <th className="px-4 py-2 text-left">{t("Created Date")}</th>
                                            <th className="px-4 py-2 text-center">{t("Actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {thresholds.map((threshold) => (
                                            <tr key={threshold.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2">{threshold.id}</td>
                                                <td className="px-4 py-2 font-semibold">
                                                    {editingSn === threshold.sn ? (
                                                        <input
                                                            type="number"
                                                            className="p-2 border rounded-md border-gray-300 w-full"
                                                            value={editForm.expense_threshold_amount}
                                                            onChange={(e) =>
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    expense_threshold_amount: Number(e.target.value),
                                                                }))
                                                            }
                                                        />
                                                    ) : (
                                                        Number(threshold.expense_threshold_amount).toLocaleString()
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {editingSn === threshold.sn ? (
                                                        <select
                                                            className="p-2 border rounded-md border-gray-300 w-full capitalize"
                                                            value={editForm.frequency}
                                                            onChange={(e) =>
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    frequency: e.target.value as "Monthly" | "Yearly",
                                                                }))
                                                            }
                                                        >
                                                            <option value="Monthly">{t("Monthly")}</option>
                                                            <option value="Yearly">{t("Yearly")}</option>
                                                        </select>
                                                    ) : (
                                                        <span className="capitalize">{t(threshold.frequency)}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {editingSn === threshold.sn ? (
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={editForm.isEnable}
                                                                onChange={(e) => {
                                                                    const newValue = e.target.checked;
                                                                    // Check if trying to enable when another of the SAME frequency is already enabled
                                                                    if (newValue) {
                                                                        const otherEnabled = thresholds.find(
                                                                            t => t.sn !== threshold.sn && t.isEnable === true && t.frequency === editForm.frequency
                                                                        );
                                                                        if (otherEnabled) {
                                                                            setFeedback({ message: t("Disable the existing {{period}} threshold first.", { period: t(editForm.frequency) }), error: true });
                                                                            return;
                                                                        }
                                                                    }
                                                                    setEditForm((prev) => ({
                                                                        ...prev,
                                                                        isEnable: newValue,
                                                                    }))
                                                                }}
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FFA726]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFAA00]"></div>
                                                            <span className="ms-3 text-sm font-medium text-gray-700">
                                                                {editForm.isEnable ? t("Enabled") : t("Disabled")}
                                                            </span>
                                                        </label>
                                                    ) : (
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-semibold ${threshold.isEnable
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {threshold.isEnable ? t("Enabled") : t("Disabled")}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {formatDate(threshold.create_date)}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {editingSn === threshold.sn ? (
                                                        <>
                                                            <button
                                                                className="text-green-600 hover:text-green-800 font-medium mr-2 cursor-pointer"
                                                                onClick={() => saveEdit(threshold.sn)}
                                                            >
                                                                {t("Save")}
                                                            </button>
                                                            <button
                                                                className="text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                                                                onClick={cancelEdit}
                                                            >
                                                                {t("Cancel")}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableActionButton action="edit" onClick={() => startEdit(threshold)} />
                                                            <TableActionButton action="delete" onClick={() => handleDelete(threshold.sn)} />
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="@min-[40rem]:hidden space-y-4">
                                {thresholds.map((threshold) => (
                                    <div
                                        key={threshold.id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        {/* Row 1: ID and Actions */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-800">
                                                ID {threshold.id}
                                            </span>
                                            <div className="flex gap-2 text-xs font-bold">
                                                {editingSn === threshold.sn ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(threshold.sn)}
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
                                                        <TableActionButton action="edit" onClick={() => startEdit(threshold)} />
                                                        <TableActionButton action="delete" onClick={() => handleDelete(threshold.sn)} />
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Content */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">{t("Amount:")}</span>
                                                {editingSn === threshold.sn ? (
                                                    <input
                                                        type="number"
                                                        className="w-32 p-1 text-sm border rounded focus:ring-1 focus:ring-[#FFAA00]"
                                                        value={editForm.expense_threshold_amount}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                expense_threshold_amount: Number(e.target.value),
                                                            }))
                                                        }
                                                    />
                                                ) : (
                                                    <span className="font-semibold">{Number(threshold.expense_threshold_amount).toLocaleString()}</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">{t("Frequency:")}</span>
                                                {editingSn === threshold.sn ? (
                                                    <select
                                                        className="w-32 p-1 text-sm border rounded"
                                                        value={editForm.frequency}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                frequency: e.target.value as "Monthly" | "Yearly",
                                                            }))
                                                        }
                                                    >
                                                        <option value="Monthly">{t("Monthly")}</option>
                                                        <option value="Yearly">{t("Yearly")}</option>
                                                    </select>
                                                ) : (
                                                    <span className="font-semibold capitalize">{t(threshold.frequency)}</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">{t("Status:")}</span>
                                                {editingSn === threshold.sn ? (
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={editForm.isEnable}
                                                            onChange={(e) => {
                                                                const newValue = e.target.checked;
                                                                // Check if trying to enable when another of the SAME frequency is already enabled
                                                                if (newValue) {
                                                                    const otherEnabled = thresholds.find(
                                                                        t => t.sn !== threshold.sn && t.isEnable === true && t.frequency === editForm.frequency
                                                                    );
                                                                    if (otherEnabled) {
                                                                        setFeedback({ message: t("Disable the existing {{period}} threshold first.", { period: t(editForm.frequency) }), error: true });
                                                                        return;
                                                                    }
                                                                }
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    isEnable: newValue,
                                                                }))
                                                            }}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FFA726]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFAA00]"></div>
                                                        <span className="ms-3 text-xs font-medium text-gray-700">
                                                            {editForm.isEnable ? t("Enabled") : t("Disabled")}
                                                        </span>
                                                    </label>
                                                ) : (
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${threshold.isEnable
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {threshold.isEnable ? t("Enabled") : t("Disabled")}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                                                <span>{t("Created:")}{" "} {formatDate(threshold.create_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
            </div>
        </ThresholdDialog>
    );
};

export default ViewThresholdModal;
