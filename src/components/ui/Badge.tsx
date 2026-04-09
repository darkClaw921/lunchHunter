import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Badge — компактный status/count индикатор по pencil lanchHunter.pen.
 * Используется для: status строки в Admin-таблицах («Активен», «На модерации»),
 * pill-бейджей с расстоянием в карточках поиска, count-индикаторов.
 *
 * Варианты: success, warning, error, neutral, accent, accent-soft.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        error: "bg-error/10 text-error border border-error/20",
        neutral:
          "bg-surface-secondary text-fg-secondary border border-border",
        accent: "bg-accent text-white border border-accent",
        "accent-soft":
          "bg-accent-light text-accent border border-accent-light",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, size, dot, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-current"
          />
        ) : null}
        {children}
      </span>
    );
  },
);

export { badgeVariants };
