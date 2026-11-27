"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import ExpenseCatalogueForm from "./components/expenseCatalogueForm";
import ExpenseCatalogueTable from "./components/expenseCatalogueTable";

export default function ExpenseCatalogueUI() {
  const { t } = useTranslation();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">{t("Expense categories")}</h1>
      <ExpenseCatalogueForm onSuccess={refreshData} />
      <section aria-labelledby="saved-catalogue-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="saved-catalogue-heading" className="mb-4 text-lg font-bold tracking-tight text-[#082c28]">{t("Saved expense categories")}</h2>
        <ExpenseCatalogueTable refreshTrigger={refreshTrigger} />
      </section>
    </main>
  );
}
