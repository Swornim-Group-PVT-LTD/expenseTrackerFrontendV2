"use client";

import { useState } from "react";
import { CurrencyPayload, CurrencyResponse } from "@/app/types/currencyType";
import { toast } from "react-toastify";
import { addCurrencyService } from "@/app/services/catalogueServices/currencyCatalogueService";

export default function CurrencyCatalogueForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [country, setCountry] = useState("");
  const [symbol, setSymbol] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!country.trim()) {
      newErrors.country = "Please input country";
    }

    if (!symbol.trim()) {
      newErrors.symbol = "Please input symbol";
    }

    if (!code.trim()) {
      newErrors.code = "Please input code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const payload: CurrencyPayload = {
        country_name: country,
        symbol: symbol,
        currency_code: code,
      };

      await addCurrencyService(payload);
      onSuccess && onSuccess();

      toast.success("Currency added successfully!");

      // Clear form
      setCountry("");
      setSymbol("");
      setCode("");
      setErrors({});
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to add currency" });
      toast.error(err.message || "Failed to add currency");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `h-11 w-full rounded-lg border px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-[#056455] ${errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {errors.form && (
        <p className="text-red-500 mb-2 font-medium">{errors.form}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* Catalogue */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Catalogue</label>
          <input
            type="text"
            value="CURRENCY"
            readOnly
            className="h-11 w-full rounded-lg border px-3 text-sm text-slate-900 bg-gray-200 cursor-not-allowed"
          />
        </div>

        {/* Country*/}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g., USA"
            className={inputClass("country")}
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        {/* Symbol */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g., $"
            className={inputClass("symbol")}
          />
          {errors.symbol && (
            <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
          )}
        </div>

        {/* Code */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., USD"
            className={inputClass("code")}
          />
          {errors.code && (
            <p className="text-red-500 text-sm mt-1">{errors.code}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-end sm:col-span-2 xl:col-span-1">
          <button
            onClick={handleAdd}
            disabled={loading}
            className={`h-11 w-full cursor-pointer rounded-lg bg-[#056455] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#034e43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
