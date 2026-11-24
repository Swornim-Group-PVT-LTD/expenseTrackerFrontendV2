import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

import { getBalancesService } from "@/app/services/balanceService";
import { BalanceResponse } from "@/app/types/balanceType";
import Link from "next/link";

import { useBalanceVisibility } from "@/app/context/BalanceHideShowContext";
import { maskAmount } from "@/app/utils/maskAmount";
import { Wallet, EyeOff, Eye } from "lucide-react";

interface BalanceCardProps {
  refreshTrigger: number;
}

const BalanceCard = ({ refreshTrigger }: BalanceCardProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("NPR");
  const { isVisible, toggleVisibility } = useBalanceVisibility();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);

        const balance: BalanceResponse = await getBalancesService();

        const latestBalance = Number(balance.closing_balance || 0);

        setCurrency(balance.currency?.symbol || "NPR");
        setBalance(latestBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(0);
        setCurrency("NPR");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [refreshTrigger]);

  const renderBalanceValue = () => {
    if (loading) {
      return <ClipLoader size={24} color="#ffffff" />;
    }
    return maskAmount(balance ?? 0, isVisible, currency);
  };

  return (
    <div className="@container relative isolate flex min-h-36 items-center gap-4 overflow-hidden rounded-2xl border border-[#17625a] bg-linear-to-br from-[#082c28] via-[#0a3f39] to-[#126158] p-5 text-white shadow-sm transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -bottom-24 h-52 w-52 rounded-full border border-white/10 bg-white/5 ring-24 ring-white/5"
      />
      <Link
        href="/dashboard/balance"
        aria-label="View total balance details"
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-amber-300"
      />
      <div className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-teal-100 @min-[15rem]:flex @min-[21rem]:size-14">
        <Wallet className="size-6" aria-hidden="true" />
      </div>
      <div className="min-w-0 @min-[15rem]:border-l @min-[15rem]:border-white/15 @min-[15rem]:pl-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-teal-50">Total Balance</span>
          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide balance" : "Show balance"}
            title={isVisible ? "Hide balance" : "Show balance"}
            className="relative z-10 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-teal-100 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <div className="mt-0.5 break-words text-2xl font-bold tracking-tight tabular-nums @min-[18rem]:text-3xl">
          {renderBalanceValue()}
        </div>
        <p className="mt-1 text-sm text-teal-100/80">Your current balance</p>
      </div>
    </div>
  );
};

export default BalanceCard;
