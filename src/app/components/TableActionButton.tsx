"use client";

import { useTranslation } from "react-i18next";
import { useRef } from "react";
import Swal from "sweetalert2";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";

interface TableActionButtonProps {
  action: "edit" | "delete";
  onClick: () => void | Promise<void>;
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
  const { t } = useTranslation();
  const active = useRef(false);
  const isDelete = action === "delete";

  const confirmAction = async () => {
    if (active.current || disabled || busy) return;

    active.current = true;
    try {
      const result = await Swal.fire({
        title: isDelete ? t("Delete this record?") : t("Edit this record?"),
        text: isDelete ? t("This action cannot be undone.") : undefined,
        icon: isDelete ? "warning" : "question",
        showCancelButton: true,
        focusCancel: true,
        reverseButtons: true,
        confirmButtonText: isDelete ? t("Delete") : t("Edit"),
        cancelButtonText: t("Cancel"),
        confirmButtonColor: isDelete ? "#b91c1c" : "#056455",
      });

      if (result.isConfirmed) await onClick();
    } finally {
      active.current = false;
    }
  };

  const Icon = busy ? LoaderCircle : action === "edit" ? Pencil : Trash2;
  const color = action === "edit"
    ? "text-blue-700 enabled:hover:bg-blue-50 dark:text-blue-300 dark:enabled:hover:bg-blue-950"
    : "text-red-700 enabled:hover:bg-red-50 dark:text-red-300 dark:enabled:hover:bg-red-950";

  return (
    <button
      type="button"
      title={t(label)}
      aria-label={t(label)}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={confirmAction}
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg align-middle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
    >
      <Icon aria-hidden="true" className={`size-[18px] ${busy ? "motion-safe:animate-spin" : ""}`} />
    </button>
  );
}
