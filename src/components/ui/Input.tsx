import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-10 rounded-lg border border-border bg-surface-raised px-3 text-sm text-foreground outline-none",
            "placeholder:text-muted-foreground/70",
            "focus:border-dash focus-visible:ring-2 focus-visible:ring-ring/40",
            error && "border-destructive focus:border-destructive",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
