import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border border-border bg-surface-raised px-3 pr-9 text-sm text-foreground outline-none",
              "focus:border-dash focus-visible:ring-2 focus-visible:ring-ring/40",
              error && "border-destructive focus:border-destructive",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
