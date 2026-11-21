// pages/investmentCatalogueUI.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InvestmentCatalogueForm from "../investmentCatalogue/component/investmentCatalogueForm";
import InvestmentCatalogueTable from "../investmentCatalogue/component/investmentCatalogueTable";

export default function InvestmentCatalogueUI() {
  const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <div className="p-4">

      <div>
        <h1 className="text-2xl font-bold mb-4">Add Investment Catalogue</h1>
      </div>

      <InvestmentCatalogueForm onSuccess={refreshData}/>
      <div className="mt-5 mb-10"></div>
      <InvestmentCatalogueTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
