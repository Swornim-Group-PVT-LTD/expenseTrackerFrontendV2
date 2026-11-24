"use client";

import { useRef, useState, type FormEvent } from "react";
import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { useCurrency } from "@/app/context/CurrencyContext";
import { maskAmount } from "@/app/utils/maskAmount";
import { toast } from "react-toastify";
import { getSavingTransferOptions, transferSavingService } from "@/app/services/savingService";
import type { SavingResponse, SavingTransferOption } from "@/app/types/savingType";

export default function SavingTransferForm({
  onSuccess,
  selected,
}: {
  onSuccess: () => Promise<void>;
  selected: SavingResponse[];
}) {
  const [showSelected, setShowSelected] = useState(false);
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

  const bulk = selected.length > 0;
  const total = selected.reduce((cents, row) => cents + Math.round(Number(row.transferable_amount) * 100), 0) / 100;

  async function openForm() {
    if (bulk) {
      setShowSelected(true);
      return;
    }

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
    if (submitting || (!bulk && !category)) return;
    if (!window.confirm("Are you sure you want to transfer savings to your balance?")) return;

    transferKey.current ??= crypto.randomUUID();
    setSubmitting(true);
    try {
      const common = {
        remarks: remarks.trim() || undefined,
        transfer_key: transferKey.current,
      };
      await transferSavingService(bulk ? {
        ...common,
        entries: selected.map((row) => ({
          id: row.id,
          amount: Number(row.transferable_amount).toFixed(2),
        })),
      } : { ...common, saving_category: category, amount });
      setShowSelected(false);
      setOptions(null);
      toast.success("Savings transferred to your balance.");
      await onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not transfer savings.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!showSelected && !options) {
    return (
      <button
        type="button"
        className="rounded-lg bg-[#0D312F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        onClick={openForm}
        disabled={loading}
      >
        {loading ? "Loading savings…" : bulk ? `Transfer selected (${selected.length})` : "Transfer saving"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white p-4">
      {showSelected ? (
        <fieldset disabled={submitting} className="space-y-3">
          <p className="text-sm font-medium">
            Transfer {selected.length} selected savings entries · {maskAmount(total, isVisible, currency)}
          </p>
          <ul className="max-h-44 overflow-y-auto text-sm text-gray-700">
            {selected.map((row) => (
              <li key={row.id}>
                #{row.id} · {row.saving_category} · {maskAmount(row.transferable_amount, isVisible, currency)}
              </li>
            ))}
          </ul>
          <label className="block text-sm font-medium">
            Remarks
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Optional"
              maxLength={255}
              className="mt-1 block w-full rounded-lg border-gray-300"
            />
          </label>
        </fieldset>
      ) : options?.length ? (
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
        <button type="button" onClick={() => { setOptions(null); setShowSelected(false); }} disabled={submitting} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
        {(showSelected || Boolean(options?.length)) && (
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#0D312F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {submitting ? "Transferring…" : "Transfer to balance"}
          </button>
        )}
      </div>
    </form>
  );
}
