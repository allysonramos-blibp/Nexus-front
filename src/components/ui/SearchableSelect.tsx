import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "./Dialog";
import { Badge } from "./Badge";

export interface SearchableSelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string | number;
}

export interface SearchableSelectProps<T extends string | number = string | number> {
  label?: string;
  value: T | null | undefined | "";
  onChange: (value: T | null) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  emptyOptionLabel?: string;
  error?: string;
  className?: string;
  modalTitle?: string;
}

export function SearchableSelect<T extends string | number = string | number>({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  emptyOptionLabel,
  error,
  className,
  modalTitle,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === "") return null;
    return options.find((opt) => String(opt.value) === String(value)) ?? null;
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  useEffect(() => {
    if (open) {
      setSearch("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const displayTitle = modalTitle || label || placeholder;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs text-muted-foreground">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-left text-sm text-foreground transition-colors flex items-center justify-between gap-2",
          "focus:border-dash focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          disabled && "opacity-50 cursor-not-allowed bg-surface/50",
          error && "border-destructive focus:border-destructive"
        )}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-medium text-foreground">{selectedOption.label}</span>
          ) : emptyOptionLabel && (value === null || value === "") ? (
            <span className="font-medium text-foreground">{emptyOptionLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={displayTitle}
        description="Selecione uma opção da lista ou digite para filtrar rapidamente."
        className="max-w-lg p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {emptyOptionLabel && !search.trim() && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 text-left transition-colors min-h-[44px]",
                value === null || value === ""
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                  : "border-border/60 bg-surface-raised/30 hover:bg-surface-raised text-foreground"
              )}
            >
              <div className="flex flex-col">
                <span className="text-sm">{emptyOptionLabel}</span>
                <span className="text-[11px] text-muted-foreground">Visualização ampla / sem filtro específico</span>
              </div>
              {(value === null || value === "") && <Check className="size-4 text-primary shrink-0" />}
            </button>
          )}

          <div className="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhum resultado encontrado para &quot;{search}&quot;.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors min-h-[44px] gap-2",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-surface-raised text-foreground"
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={cn("text-sm break-words", isSelected ? "font-semibold text-primary" : "text-foreground")}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-muted-foreground truncate">{opt.sublabel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <Badge variant="default" className="text-[10px]">
                          {opt.badge}
                        </Badge>
                      )}
                      {isSelected && <Check className="size-4 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
