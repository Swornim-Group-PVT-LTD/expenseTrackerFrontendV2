import type { MouseEventHandler } from "react";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";

interface TableActionButtonProps {
  action: "edit" | "delete";
  onClick: MouseEventHandler<HTMLButtonElement>;
  label?: string;
  disabled?: boolean;
  busy?: boolean;
}

export default function TableActionButton({
  action,
  onClick,
  label = action === "edit" ? "Edit" : "Delete",
  disabled,
  busy,
}: TableActionButtonProps) {
  const Icon = busy ? LoaderCircle : action === "edit" ? Pencil : Trash2;
  const color = action === "edit"
    ? "text-blue-700 enabled:hover:bg-blue-50 dark:text-blue-300 dark:enabled:hover:bg-blue-950"
    : "text-red-700 enabled:hover:bg-red-50 dark:text-red-300 dark:enabled:hover:bg-red-950";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={onClick}
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg align-middle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
    >
      <Icon aria-hidden="true" className={`size-[18px] ${busy ? "motion-safe:animate-spin" : ""}`} />
    </button>
  );
}
