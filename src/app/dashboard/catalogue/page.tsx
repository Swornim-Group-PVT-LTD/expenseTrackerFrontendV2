import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, Coins, PiggyBank, TrendingUp } from "lucide-react";

const catalogues = [
  { title: "Expense categories", path: "expenseCatalogue", Icon: ArrowDown, accent: "bg-rose-50 text-rose-700" },
  { title: "Income categories", path: "incomeCatalogue", Icon: ArrowUp, accent: "bg-emerald-50 text-emerald-800" },
  { title: "Savings categories", path: "savingCatalogue", Icon: PiggyBank, accent: "bg-teal-50 text-teal-800" },
  { title: "Investment categories", path: "investmentCatalogue", Icon: TrendingUp, accent: "bg-amber-50 text-amber-800" },
  { title: "Currencies", path: "currencyCatalogue", Icon: Coins, accent: "bg-sky-50 text-sky-800" },
];

export default function CataloguePage() {
  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#082c28] dark:text-white sm:text-3xl">Catalogue</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage the categories and currencies available in your forms.
        </p>
      </div>

      <nav aria-label="Catalogue sections" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {catalogues.map(({ title, path, Icon, accent }) => (
          <Link
            key={path}
            href={`/dashboard/catalogue/${path}`}
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-base font-semibold text-[#082c28] shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] sm:p-5"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${accent}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>{title}</span>
            <ArrowUpRight className="ml-auto size-4 shrink-0 text-slate-500 group-hover:text-[#056455]" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </main>
  );
}
