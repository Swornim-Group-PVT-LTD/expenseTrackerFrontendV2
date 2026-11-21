"use client";

import { useRouter } from "next/navigation";
import SavingCatalogueForm from "../savingCatalogue/component/savingCatalogueForm";
import SavingCatalogueTable from "../savingCatalogue/component/savingCatalogueTable";
import { useState } from "react";

export default function SavingCatalogueUI() {
  const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <div className="p-4">

      <div>
        <h1 className="text-2xl font-bold mb-4">Add Saving Catalogue</h1>
      </div>

      {/* Form */}
      <SavingCatalogueForm  onSuccess={refreshData}/>

      <div className="mt-5 mb-10"></div>

      {/* Table */}
      <SavingCatalogueTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
