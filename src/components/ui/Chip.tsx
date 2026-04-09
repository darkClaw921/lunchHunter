"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { useHaptics } from "@/lib/hooks/useHaptics";

/**
 * Chip / Pill primitive по pencil lanchHunter.pen.
 * Используется для фильтров категорий и популярных запросов.
 *
 * Варианты:
 * - default: нейтральный outline (inactive filter)
 * - active: accent solid (selected)
 * - soft: accent-light фон + accent текст (chip популярных запросов)
 *
 * **Press feedback:**
 * - Scale-эффект на :active обеспечивается глобальным правилом в
 *   `globals.css` (`button, a, [role="button"]` → `scale(0.97)`). Chip
 *   рендерится как `<button>`, локальные `active:scale-*` не нужны.
 * - `haptics.selection()` — тактильный отклик «изменение выбора», подходящий
 *   для фильтр-чипов.
 */
const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors " +
    "select-none whitespace-nowrap cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  {
    variants: {
      variant: {
        default:
          "bg-surface-primary border border-border text-fg-primary hover:bg-surface-secondary",
        active:
          "bg-accent text-white border border-accent hover:bg-accent-dark",
        soft:
          "bg-accent-light text-accent border border-transparent hover:bg-accent-light/70",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  active?: boolean;
  leftIcon?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  function Chip(
    {
      className,
      variant,
      size,
      active,
      leftIcon,
      children,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) {
    const haptics = useHaptics();
    const resolvedVariant = active ? "active" : variant ?? "default";

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        haptics.selection();
        onClick?.(event);
      },
      [haptics, onClick],
    );

    return (
      <button
        ref={ref}
        type={type}
        data-active={active ? "true" : undefined}
        className={cn(chipVariants({ variant: resolvedVariant, size }), className)}
        onClick={handleClick}
        {...props}
      >
        {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {children}
      </button>
    );
  },
);

export { chipVariants };
