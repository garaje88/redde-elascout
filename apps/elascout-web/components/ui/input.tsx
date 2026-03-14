"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-surface"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg border border-dark-50 bg-dark-100 px-4 py-2.5 text-sm text-surface placeholder:text-muted",
            "transition-colors duration-150",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
