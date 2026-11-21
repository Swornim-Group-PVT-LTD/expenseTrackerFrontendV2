"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ExpenseCatalogueForm from "./components/expenseCatalogueForm";
import ExpenseCatalogueTable from "./components/expenseCatalogueTable";

export default function ExpenseCatalogueUI() {

    const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const router = useRouter();
  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">Add Expense Catalogue</h1>
      </div>
      {/* Form */}
      <ExpenseCatalogueForm onSuccess={refreshData} />
      <div className="mt-5 mb-10"></div>
      {/* Table */}
      <ExpenseCatalogueTable refreshTrigger={refreshTrigger} />
    </div>
  );
}
