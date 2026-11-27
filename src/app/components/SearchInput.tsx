"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  options: { id: number; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const menuHeight = 240;
const menuGap = 6;

export default function SearchInput({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}: SearchInputProps) {
  const { t } = useTranslation();
  const listId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  const triggerLabel = placeholder ?? t("Select category...");
  const searchLabel = t("Type to search...");
  const query = searchText.trim().toLowerCase();
  const matchingOptions = options
    .filter((option) => !query || option.value.toLowerCase().includes(query))
    .map((option) => ({ id: String(option.id), value: option.value, label: option.value }));
  const displayOptions = value && !query
    ? [...matchingOptions, { id: "clear", value: "", label: t("Clear selection") }]
    : matchingOptions;
  const activeOption = displayOptions[activeIndex];

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const viewportHeight = document.documentElement.clientHeight;
      if (anchor.bottom < 0 || anchor.top > viewportHeight) {
        setPosition(null);
        return;
      }
      const below = viewportHeight - anchor.bottom - menuGap;
      const above = anchor.top - menuGap;
      const placeAbove = below < menuHeight && above > below;
      setPosition({
        left: anchor.left,
        width: anchor.width,
        ...(placeAbove ? { bottom: viewportHeight - anchor.top + menuGap } : { top: anchor.bottom + menuGap }),
        maxHeight: Math.min(menuHeight, Math.max(0, placeAbove ? above : below)),
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && activeOption) {
      document.getElementById(`${listId}-${activeOption.id}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeOption?.id, listId, open]);

  const expanded = Boolean(open && position);

  useEffect(() => {
    if (expanded) inputRef.current?.focus({ preventScroll: true });
  }, [expanded]);

  const openOptions = () => {
    setSearchText("");
    setActiveIndex(-1);
    setOpen(true);
  };

  const closeAndFocusTrigger = () => {
    setOpen(false);
    anchorRef.current?.focus({ preventScroll: true });
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    closeAndFocusTrigger();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={anchorRef}
        type="button"
        aria-label={value ? `${triggerLabel} ${value}` : triggerLabel}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openOptions();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openOptions();
          }
        }}
        className="flex h-full min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 text-left text-sm font-medium transition-colors hover:border-[#056455] focus-visible:border-[#056455] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#056455]/20"
      >
        <span className={`truncate ${value ? "text-[#082c28]" : "text-slate-500"}`}>{value || triggerLabel}</span>
        <ChevronDown className={`size-4 shrink-0 text-[#056455] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && position && createPortal(
        <div
          ref={panelRef}
          style={position}
          className="fixed z-[80] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(8,44,40,0.16)]"
        >
          <div className="border-b border-slate-100 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 focus-within:border-[#056455] focus-within:ring-2 focus-within:ring-[#056455]/20">
              <Search className="size-4 shrink-0 text-[#056455]" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-label={searchLabel}
                aria-autocomplete="list"
                aria-expanded={true}
                aria-controls={listId}
                aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
                autoComplete="off"
                placeholder={searchLabel}
                value={searchText}
                onBlur={(event) => {
                  if (event.relatedTarget !== anchorRef.current) setOpen(false);
                }}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;

                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    closeAndFocusTrigger();
                  } else if (event.key === "Tab") {
                    closeAndFocusTrigger();
                  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    const count = displayOptions.length;
                    setActiveIndex((index) => {
                      if (!count) return -1;
                      if (index < 0 || index >= count) return direction > 0 ? 0 : count - 1;
                      return (index + direction + count) % count;
                    });
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (activeOption) selectOption(activeOption.value);
                  }
                }}
                className="min-h-9 w-full min-w-0 border-0 bg-transparent px-0 text-sm text-[#082c28] outline-none placeholder:text-slate-500 focus:ring-0"
              />
            </div>
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={triggerLabel}
            className="min-h-0 overflow-y-auto overscroll-contain p-1.5"
          >
            {displayOptions.length ? displayOptions.map((option, index) => (
              <li
                id={`${listId}-${option.id}`}
                key={option.id}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option.value)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-800 hover:bg-teal-50 ${index === activeIndex ? "bg-teal-50 ring-1 ring-inset ring-teal-100" : ""}`}
              >
                <span className="min-w-0 break-words">{option.label}</span>
                {option.value === value && <Check className="size-4 shrink-0 text-[#056455]" aria-hidden="true" />}
              </li>
            )) : (
              <li role="presentation" className="px-2.5 py-2 text-sm text-slate-600">
                <span role="status">{t("No matching options")}</span>
              </li>
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
