"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import InvestmentCatalogueForm from "../investmentCatalogue/component/investmentCatalogueForm";
import InvestmentCatalogueTable from "../investmentCatalogue/component/investmentCatalogueTable";

export default function InvestmentCatalogueUI() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">{t("Investment categories")}</h1>
      <InvestmentCatalogueForm onSuccess={refreshData} />
      <section aria-labelledby="saved-catalogue-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="saved-catalogue-heading" className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">{t("Saved investment categories")}</h2>
        <InvestmentCatalogueTable refreshTrigger={refreshTrigger} />
      </section>
    </main>
  );
}
