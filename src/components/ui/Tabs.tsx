import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    const index = items.findIndex((i) => i.value === value);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = items[(index + dir + items.length) % items.length];
      onChange(next.value);
      const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`);
      btn?.focus();
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-surface-raised text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon && <item.icon className="size-3.5" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
