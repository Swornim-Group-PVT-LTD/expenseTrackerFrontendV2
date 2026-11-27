"use client";

// components/investmentCatalogueForm.tsx
"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { addInvestmentCategoryService } from "../../../../services/catalogueServices/investmentCatalogueService";
import { AddInvestmentCategoryPayload } from "../../../../types/catalolgueType/investmentCatalogueType";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


interface InvestmentCatalogueFormProps {
  onSuccess: () => void;
}

export default function InvestmentCatalogueForm({ onSuccess }: InvestmentCatalogueFormProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState("");
  const [additional1, setAdditional1] = useState("");
  const [additional2, setAdditional2] = useState("");
  const [additional3, setAdditional3] = useState("");
  const [additional4, setAdditional4] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!category.trim()) newErrors.category = "Please input category";

    [additional1, additional2, additional3, additional4].forEach((val, idx) => {
      if (val && isNaN(Number(val))) newErrors[`additional${idx + 1}`] = "Please input number";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const payload: AddInvestmentCategoryPayload = {
        static_value: "INVESTMENT",
        investment_category: category,
        additional_value1: additional1 || null,
        additional_value2: additional2 || null,
        additional_value3: additional3 || null,
        additional_value4: additional4 || null,
      };

      await addInvestmentCategoryService(payload);
      onSuccess && onSuccess();
      toast.success(t("Investment category added successfully!"));

      setCategory(""); setAdditional1(""); setAdditional2(""); setAdditional3(""); setAdditional4(""); setErrors({});
    } catch (err: any) {
      setErrors({ form: err.message || t("Failed to add investment category") });
      toast.error(err.message || t("Failed to add investment category"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `h-11 w-full rounded-lg border px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-[#056455] ${errors[field] ? "border-red-500" : "border-gray-300"}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {errors.form && <p className="text-red-500 mb-2 font-medium">{t(errors.form)}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">{t("Catalogue")}</label>
          <input type="text" value="INVESTMENT" readOnly className="h-11 w-full rounded-lg border px-3 text-sm text-slate-900 bg-gray-200 cursor-not-allowed" />
        </div>

        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">{t("Investment Category")}</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("e.g., Stocks")} className={inputClass("category")} />
          {errors.category && <p className="text-red-500 text-sm mt-1">{t(errors.category)}</p>}
        </div>

        {[additional1, additional2, additional3, additional4].map((val, idx) => (
          <div className="lg:col-span-1" key={idx}>
            <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">{t("Additional")}{" "} {idx + 1}</label>
            <input type="text" value={val} onChange={(e) => {
              const setters = [setAdditional1, setAdditional2, setAdditional3, setAdditional4];
              setters[idx](e.target.value);
            }} className={inputClass(`additional${idx + 1}`)} />
            {errors[`additional${idx + 1}`] && <p className="text-red-500 text-sm mt-1">{t(errors[`additional${idx + 1}`])}</p>}
          </div>
        ))}

        <div className="flex items-end sm:col-span-2 xl:col-span-1">
          <button onClick={handleAdd} disabled={loading} className={`h-11 w-full cursor-pointer rounded-lg bg-[#056455] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#034e43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
            {loading ? t("Adding...") : t("Add")}
          </button>
        </div>
      </div>
    </div>
  );
}
