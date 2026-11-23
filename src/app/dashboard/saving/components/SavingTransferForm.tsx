"use client";

import { useRef, useState, type FormEvent } from "react";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { useCurrency } from "@/app/context/CurrencyContext";
import { maskAmount } from "@/app/utils/maskAmount";
import { toast } from "react-toastify";
import { getSavingTransferOptions, transferSavingService } from "@/app/services/savingService";
import type { SavingTransferOption } from "@/app/types/savingType";

export default function SavingTransferForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [options, setOptions] = useState<SavingTransferOption[] | null>(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const transferKey = useRef<string | null>(null);
  const { isVisible } = useBalanceVisibility();
  const { currency } = useCurrency();
  const availableAmount = options?.find((option) => option.saving_category === category)?.total_amount;

  async function openForm() {
    setLoading(true);
    try {
      const available = await getSavingTransferOptions();
      setOptions(available);
      setCategory(available[0]?.saving_category ?? "");
      setAmount("");
      setRemarks("");
      transferKey.current = null;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load available savings.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !category) return;

    transferKey.current ??= crypto.randomUUID();
    setSubmitting(true);
    try {
      await transferSavingService({
        saving_category: category,
        amount,
        remarks: remarks.trim() || undefined,
        transfer_key: transferKey.current,
      });
      setOptions(null);
      toast.success("Savings transferred to your balance.");
      await onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not transfer savings.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!options) {
    return (
      <button
        type="button"
        className="rounded-lg bg-[#0D312F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        onClick={openForm}
        disabled={loading}
      >
        {loading ? "Loading savings…" : "Transfer saving"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white p-4">
      {options.length ? (
        <fieldset disabled={submitting} className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Saving category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300"
              required
            >
              {options.map((option) => (
                <option key={option.saving_category} value={option.saving_category}>
                  {option.saving_category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Amount
            <input
              type="number"
              min="0.01"
              max={availableAmount}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300"
              required
            />
            <span className="mt-1 block text-xs text-gray-600">
              Available {maskAmount(Number(availableAmount ?? 0), isVisible, currency)}
            </span>
          </label>
          <label className="text-sm font-medium">
            Remarks
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder={category}
              maxLength={255}
              className="mt-1 block w-full rounded-lg border-gray-300"
            />
          </label>
        </fieldset>
      ) : (
        <p className="text-sm text-gray-600">No savings are available to transfer.</p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setOptions(null)} disabled={submitting} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
        {options.length > 0 && (
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#0D312F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {submitting ? "Transferring…" : "Transfer to balance"}
          </button>
        )}
      </div>
    </form>
  );
}
