"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { type LucideIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ThresholdDialog({
  title,
  icon: Icon,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => {
    ref.current?.close();
    onClose();
  };

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white text-[#082c28] shadow-2xl backdrop:bg-slate-950/55 ${wide ? "max-w-4xl" : "max-w-xl"}`}
    >
      <header className="flex items-center gap-3 border-b border-teal-100 bg-teal-50 px-5 py-4 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#056455] ring-1 ring-teal-100">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="min-w-0 flex-1 text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        <button
          type="button"
          aria-label={t("Close")}
          onClick={close}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
