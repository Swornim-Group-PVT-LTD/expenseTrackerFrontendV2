"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import BalanceCard from "@/app/components/BalanceCard";
import BalanceForm from "./components/BalanceForm";
import BalanceTable from "./components/BalanceTable";
import RemainingBalanceChart from "./components/RemainingBalanceChart";

export default function BalancePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleRefresh = () => setRefreshTrigger((previous) => previous + 1);

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">
        Balance
      </h1>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <BalanceCard refreshTrigger={refreshTrigger} linkToDetails={false} />
        <BalanceForm onSuccess={handleRefresh} />
      </div>

      <RemainingBalanceChart refreshTrigger={refreshTrigger} />

      <section aria-labelledby="balance-record-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="balance-record-heading" className="text-lg font-bold tracking-tight text-[#082c28]">
            Balance record
          </h2>
          <Link href="/dashboard/statement" className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-[#056455] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]">
            View account statement <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <BalanceTable refreshTrigger={refreshTrigger} />
      </section>
    </main>
  );
}
