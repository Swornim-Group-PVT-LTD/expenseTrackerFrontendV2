"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { AlertCircle, Plus, Target } from "lucide-react";
import ThresholdDialog from "./ThresholdDialog";
import { toast } from "react-toastify";
import { addThresholdService, getThresholdsService } from "@/app/services/thresholdService";
import { AddThresholdPayload } from "@/app/types/thresholdType";

interface ThresholdFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ThresholdForm = ({ isOpen, onClose, onSuccess }: ThresholdFormProps) => {
  const { t } = useTranslation();
    const [amount, setAmount] = useState<number | "">("");
    const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasEnabledThreshold, setHasEnabledThreshold] = useState(false);
    const [checkingThresholds, setCheckingThresholds] = useState(false);

    // Check for existing enabled thresholds when modal opens
    useEffect(() => {
        const checkEnabledThresholds = async () => {
            if (!isOpen) return;

            try {
                setCheckingThresholds(true);
                const thresholds = await getThresholdsService();

                // Check if there's an enabled threshold of the SAME frequency
                const hasEnabledSameFrequency = thresholds.some(
                    t => t.isEnable === true && t.frequency === frequency
                );
                setHasEnabledThreshold(hasEnabledSameFrequency);

                // If there's already an enabled threshold of the same frequency, set this one to disabled
                if (hasEnabledSameFrequency) {
                    setIsEnabled(false);
                }
            } catch (error) {
                console.error("Failed to check thresholds:", error);
            } finally {
                setCheckingThresholds(false);
            }
        };

        checkEnabledThresholds();
    }, [isOpen, frequency]); // Re-check when frequency changes

    const handleSubmit = async () => {
        setErrorMessage("");
        // Validation
        if (!amount || amount <= 0) {
            setErrorMessage(t("Please enter a valid threshold amount"));
            return;
        }

        // Check if trying to enable when another threshold of the same frequency is already enabled
        if (isEnabled && hasEnabledThreshold) {
            setErrorMessage(t("Disable the existing {{period}} threshold first.", { period: t(frequency) }));
            return;
        }

        try {
            setLoading(true);

            const payload: AddThresholdPayload = {
                expense_threshold_amount: Number(amount),
                frequency: frequency,
                isEnable: isEnabled,
            };

            await addThresholdService(payload);

            toast.success(t("Threshold of {{amount}} added successfully.", { amount }));

            // Reset form
            setAmount("");
            setFrequency("Monthly");
            setIsEnabled(true);
            setHasEnabledThreshold(false);

            onSuccess && onSuccess();
            onClose();
        } catch (error: any) {
            setErrorMessage(error.message || t("Failed to add threshold"));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrorMessage("");
        setAmount("");
        setFrequency("Monthly");
        setIsEnabled(true);
        setHasEnabledThreshold(false);
        onClose();
    };

    if (!isOpen) return null;

    const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 focus-visible:border-[#056455] focus-visible:outline-2 focus-visible:outline-[#056455]";

    return (
        <ThresholdDialog title={t("Add Expense Threshold")} icon={Target} onClose={handleClose}>
            <form
                aria-busy={loading}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!loading) void handleSubmit();
                }}
            >
                <div className="space-y-4 px-5 py-5 sm:px-6">
                    {errorMessage && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            {errorMessage}
                        </p>
                    )}
                    {hasEnabledThreshold && (
                        <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-bold">{t("An active {{period}} threshold already exists.", { period: t(frequency) })}</p>
                                <p className="mt-1 text-sm leading-5">
                                    {t("Only one active threshold per period is allowed. Disable the existing {{period}} threshold in View Thresholds before adding another.", { period: t(frequency) })}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5 text-sm font-semibold">
                            <span className="block">{t("Expense Threshold Amount")}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                placeholder="0"
                                className={fieldClass}
                                value={amount}
                                onChange={(event) => setAmount(event.target.value === "" ? "" : Number(event.target.value))}
                            />
                        </label>
                        <label className="space-y-1.5 text-sm font-semibold">
                            <span className="block">{t("Frequency")}</span>
                            <select
                                className={fieldClass}
                                value={frequency}
                                onChange={(event) => setFrequency(event.target.value as "Monthly" | "Yearly")}
                            >
                                <option value="Monthly">{t("Monthly")}</option>
                                <option value="Yearly">{t("Yearly")}</option>
                            </select>
                        </label>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 has-[:enabled]:cursor-pointer">
                        <span>
                            <span className="block text-sm font-semibold">{t("Enable Threshold")}</span>
                            <span className="mt-0.5 block text-xs text-slate-600">{isEnabled ? t("Enabled") : t("Disabled")}</span>
                        </span>
                        <input
                            type="checkbox"
                            aria-label={t("Enable Threshold")}
                            className="size-5 shrink-0 accent-[#056455] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:opacity-60"
                            checked={isEnabled}
                            onChange={(event) => setIsEnabled(event.target.checked)}
                            disabled={hasEnabledThreshold || checkingThresholds}
                        />
                    </label>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                    <button type="button" onClick={handleClose} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]">
                        {t("Cancel")}
                    </button>
                    <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#056455] px-4 text-sm font-semibold text-white enabled:hover:bg-[#034e43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:opacity-60">
                        <Plus className="size-4" aria-hidden="true" />
                        {loading ? t("Adding...") : t("Add Threshold")}
                    </button>
                </div>
            </form>
        </ThresholdDialog>
    );
};

export default ThresholdForm;
