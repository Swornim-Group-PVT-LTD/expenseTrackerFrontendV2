"use client";

import SavingCatalogueForm from "../savingCatalogue/component/savingCatalogueForm";
import SavingCatalogueTable from "../savingCatalogue/component/savingCatalogueTable";
import { useState } from "react";

export default function SavingCatalogueUI() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">Savings categories</h1>
      <SavingCatalogueForm onSuccess={refreshData} />
      <section aria-labelledby="saved-catalogue-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="saved-catalogue-heading" className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">Saved savings categories</h2>
        <SavingCatalogueTable refreshTrigger={refreshTrigger} />
      </section>
    </main>
  );
}
