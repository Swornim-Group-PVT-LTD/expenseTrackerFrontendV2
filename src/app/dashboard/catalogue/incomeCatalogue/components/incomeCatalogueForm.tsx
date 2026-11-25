"use client";

import { useState } from "react";
import { addIncomeCategoryService } from "../../../../services/catalogueServices/incomeCatalogueService";
import { AddIncomeCategoryPayload } from "../../../../types/catalolgueType/incomeCatalogueType";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface IncomeCatalogueFormProps {
  onSuccess?: () => void;
}

export default function IncomeCatalogueForm({ onSuccess }: IncomeCatalogueFormProps) {
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

    const numberFields = [
      { value: additional1, name: "additional1" },
      { value: additional2, name: "additional2" },
      { value: additional3, name: "additional3" },
      { value: additional4, name: "additional4" },
    ];

    numberFields.forEach((field) => {
      if (field.value && isNaN(Number(field.value))) {
        newErrors[field.name] = "Please input number";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const payload: AddIncomeCategoryPayload = {
        static_value: "INCOME",
        income_category: category,
        additional_value1: additional1 || null,
        additional_value2: additional2 || null,
        additional_value3: additional3 || null,
        additional_value4: additional4 || null,
      };

      await addIncomeCategoryService(payload);
      onSuccess && onSuccess();
      toast.success("Income category added successfully!");

      // Clear form
      setCategory("");
      setAdditional1("");
      setAdditional2("");
      setAdditional3("");
      setAdditional4("");
      setErrors({});
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to add income category" });
      toast.error(err.message || "Failed to add income category");
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        {/* Catalogue */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Catalogue</label>
          <input
            type="text"
            value="INCOME"
            readOnly
            className="h-11 w-full rounded-lg border px-3 text-sm text-slate-900 bg-gray-200 cursor-not-allowed"
          />
        </div>

        {/* Income Category */}
        <div className="lg:col-span-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">Income Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Salary"
            className={inputClass("category")}
          />
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Additional Values */}
        {[additional1, additional2, additional3, additional4].map((val, idx) => (
          <div className="lg:col-span-1" key={idx}>
            <label className="mb-1.5 block text-sm font-semibold text-[#082c28]">
              Additional {idx + 1}
            </label>
            <input
              type="text"
              value={val}
              onChange={(e) => {
                const setters = [setAdditional1, setAdditional2, setAdditional3, setAdditional4];
                setters[idx](e.target.value);
              }}
              className={inputClass(`additional${idx + 1}`)}
            />
            {errors[`additional${idx + 1}`] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[`additional${idx + 1}`]}
              </p>
            )}
          </div>
        ))}

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
