"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CurrencyCatalogueForm from "./component/currencyCatalogueForm";
import CurrencyCatalougeTable from "./component/currencyCatalougeTable"; 
export default function CurrencyCatalogueUI() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const router = useRouter();

  return (
    <div className="p-4">

      <div>
        <h1 className="text-2xl font-bold mb-4">Add Currency Catalogue</h1>
      </div>

      {/* Form */}
      <CurrencyCatalogueForm onSuccess={refreshData} />

      <div className="mt-5 mb-10"></div>

      {/* Table */}
      <CurrencyCatalougeTable refreshTrigger={refreshTrigger} /> 
    </div>
  );
}
