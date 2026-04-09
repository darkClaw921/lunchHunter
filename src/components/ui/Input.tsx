import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Базовый Input + SearchInput по pencil lanchHunter.pen.
 * - surface-secondary заливка, radius md, border
 * - focus: border-accent
 * - error: border-error
 * - слот leftIcon (lucide) + опциональный rightSlot (кнопка clear и т.п.)
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: boolean;
  inputSize?: "sm" | "md" | "lg";
  containerClassName?: string;
}

const sizeStyles: Record<NonNullable<InputProps["inputSize"]>, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-[15px]",
  lg: "h-14 text-base",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      containerClassName,
      leftIcon,
      rightSlot,
      error = false,
      inputSize = "md",
      type = "text",
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 w-full rounded-lg border bg-surface-secondary",
          "px-4 transition-colors",
          "focus-within:border-accent focus-within:bg-surface-primary",
          error ? "border-error" : "border-border",
          disabled && "opacity-50 pointer-events-none",
          sizeStyles[inputSize],
          containerClassName,
        )}
      >
        {leftIcon ? (
          <span className="shrink-0 text-fg-muted flex items-center">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent outline-none border-none",
            "placeholder:text-fg-muted text-fg-primary",
            "min-w-0",
            className,
          )}
          {...props}
        />
        {rightSlot ? <span className="shrink-0">{rightSlot}</span> : null}
      </div>
    );
  },
);

/**
 * SearchInput — pre-configured Input с иконкой поиска из lucide-react.
 */
import { Search } from "lucide-react";

export type SearchInputProps = Omit<InputProps, "leftIcon" | "type">;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(props, ref) {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-5 w-5" aria-hidden="true" />}
        placeholder={props.placeholder ?? "Пиво, суши, кофе..."}
        {...props}
      />
    );
  },
);
