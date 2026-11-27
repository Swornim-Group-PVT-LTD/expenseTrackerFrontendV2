"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

interface ActionDialogProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "teal" | "red" | "amber";
  dismissLabel: string;
  onDismiss: () => void;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  confirmDisabled?: boolean;
}

const iconColors = {
  teal: "bg-teal-50 text-[#056455] dark:bg-teal-950 dark:text-teal-300",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

export default function ActionDialog({
  title,
  description,
  icon: Icon,
  tone = "teal",
  dismissLabel,
  onDismiss,
  confirmLabel,
  onConfirm,
  confirmDisabled,
}: ActionDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const dismiss = () => {
    ref.current?.close();
    onDismiss();
  };

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) dismiss();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl backdrop:bg-slate-950/55 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
    >
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className={`mb-4 grid size-11 place-items-center rounded-xl ${iconColors[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
        <p id={descriptionId} className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>

      <div className={`grid gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6 ${onConfirm ? "grid-cols-2" : "justify-end"}`}>
        <button
          type="button"
          autoFocus
          onClick={dismiss}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {dismissLabel}
        </button>
        {onConfirm && (
          <button
            type="button"
            onClick={() => {
              if (!ref.current?.open) return;
              dismiss();
              void onConfirm();
            }}
            disabled={confirmDisabled}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${tone === "red" ? "bg-red-700 hover:bg-red-800 focus-visible:outline-red-700" : "bg-[#056455] hover:bg-[#034e43] focus-visible:outline-[#056455]"}`}
          >
            {confirmLabel}
          </button>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
