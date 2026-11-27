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
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  const inputLabel = placeholder ?? t("Type to search...");
  const query = searching ? value.trim().toLowerCase() : "";
  const displayOptions = query
    ? options.filter((option) => option.value.toLowerCase().includes(query))
    : options;
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
      if (!anchorRef.current?.contains(target) && !listRef.current?.contains(target)) {
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

  const openOptions = () => {
    setSearching(false);
    setActiveIndex(-1);
    setOpen(true);
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setActiveIndex(-1);
  };

  const expanded = Boolean(open && position);

  return (
    <div ref={anchorRef} className={`relative ${className}`}>
      <div className="flex h-full min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 pl-3 transition-colors focus-within:border-[#056455] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#056455]/20">
        <Search className="size-4 shrink-0 text-[#056455]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={inputLabel}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && activeOption ? `${listId}-${activeOption.id}` : undefined}
          autoComplete="off"
          placeholder={inputLabel}
          value={value}
          onFocus={openOptions}
          onClick={() => { if (!open) openOptions(); }}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            onChange(event.target.value);
            setSearching(true);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;

            if (event.key === "Escape" && open) {
              event.stopPropagation();
              setOpen(false);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              const optionCount = open ? displayOptions.length : options.length;
              if (!open) openOptions();
              setActiveIndex((index) => {
                if (!optionCount) return -1;
                if (!open || index < 0 || index >= optionCount) return direction > 0 ? 0 : optionCount - 1;
                return (index + direction + optionCount) % optionCount;
              });
            } else if (event.key === "Enter" && open && activeOption) {
              event.preventDefault();
              selectOption(activeOption.value);
            }
          }}
          className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium text-[#082c28] outline-none placeholder:text-slate-500 focus:ring-0"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? t("Hide options") : t("Show options")}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              inputRef.current?.focus();
              openOptions();
            }
          }}
          className="grid size-10 shrink-0 place-items-center rounded-r-xl text-slate-600 transition-colors hover:bg-teal-50 hover:text-[#056455]"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {open && position && createPortal(
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={inputLabel}
          style={position}
          onMouseDown={(event) => event.preventDefault()}
          className="fixed z-[80] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(8,44,40,0.16)]"
        >
          {displayOptions.length ? displayOptions.map((option, index) => (
            <li
              id={`${listId}-${option.id}`}
              key={option.id}
              role="option"
              aria-selected={option.value === value}
              onClick={() => selectOption(option.value)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-800 hover:bg-teal-50 ${index === activeIndex ? "bg-teal-50 ring-1 ring-inset ring-teal-100" : ""}`}
            >
              <span className="min-w-0 break-words">{option.value}</span>
              {option.value === value && <Check className="size-4 shrink-0 text-[#056455]" aria-hidden="true" />}
            </li>
          )) : (
            <li role="presentation" className="px-2.5 py-2 text-sm text-slate-600">
              <span role="status">{t("No matching options")}</span>
            </li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}
