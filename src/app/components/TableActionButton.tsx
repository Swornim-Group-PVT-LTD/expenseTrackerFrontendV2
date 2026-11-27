"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const isDelete = action === "delete";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  const confirmAction = async () => {
    const dialog = dialogRef.current;
    if (active.current || disabled || busy || !dialog?.open) return;

    active.current = true;
    dialog.close();
    try {
      await onClick();
    } finally {
      active.current = false;
    }
  };

  const DialogIcon = isDelete ? Trash2 : Pencil;
  const Icon = busy ? LoaderCircle : action === "edit" ? Pencil : Trash2;
  const color = action === "edit"
    ? "text-blue-700 enabled:hover:bg-blue-50 dark:text-blue-300 dark:enabled:hover:bg-blue-950"
    : "text-red-700 enabled:hover:bg-red-50 dark:text-red-300 dark:enabled:hover:bg-red-950";

  return (
    <>
      <button
        type="button"
        title={t(label)}
        aria-label={t(label)}
        aria-haspopup="dialog"
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onClick={() => {
          if (!active.current) setIsOpen(true);
        }}
        className={`inline-grid size-9 shrink-0 place-items-center rounded-lg align-middle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
      >
        <Icon aria-hidden="true" className={`size-[18px] ${busy ? "motion-safe:animate-spin" : ""}`} />
      </button>

      {isOpen && createPortal(
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClose={() => setIsOpen(false)}
          onClick={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
          className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl backdrop:bg-slate-950/55 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
        >
          <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <div className={`mb-4 grid size-11 place-items-center rounded-xl ${isDelete ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-teal-50 text-[#056455] dark:bg-teal-950 dark:text-teal-300"}`}>
              <DialogIcon className="size-5" aria-hidden="true" />
            </div>
            <h2 id={titleId} className="text-xl font-bold tracking-tight">
              {isDelete ? t("Delete this record?") : t("Edit this record?")}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isDelete ? t("This action cannot be undone.") : t("You can review your changes before saving.")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={confirmAction}
              disabled={disabled || busy}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${isDelete ? "bg-red-700 hover:bg-red-800 focus-visible:outline-red-700" : "bg-[#056455] hover:bg-[#034e43] focus-visible:outline-[#056455]"}`}
            >
              {isDelete ? t("Delete") : t("Edit")}
            </button>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
