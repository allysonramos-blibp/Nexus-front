import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs text-muted-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            "rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground outline-none",
            "placeholder:text-muted-foreground/70",
            "focus:border-dash focus-visible:ring-2 focus-visible:ring-ring/40",
            error && "border-destructive focus:border-destructive",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
