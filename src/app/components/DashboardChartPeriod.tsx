import { ChevronDown } from "lucide-react";

export default function DashboardChartPeriod({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-2.5 text-sm font-medium text-[#082c28] focus-visible:outline-2 focus-visible:outline-[#056455]"
      >
        <option value="yearly">Yearly</option>
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
        <option value="daily">Daily</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </div>
  );
}
