import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Button primitive. Стили по pencil lanchHunter.pen:
 * - primary: заливка accent #FF5C00, белый текст
 * - secondary: мягкая заливка surface-secondary с тёмным текстом
 * - ghost: без фона, accent hover
 * - accent-soft: фон accent-light (#FFF0E6) с accent-текстом (для chips-like CTA)
 * - danger: красная заливка
 *
 * Размеры sm/md/lg + опциональная fullWidth.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors " +
    "whitespace-nowrap select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-0 " +
    "disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-dark active:bg-accent-dark shadow-sm",
        secondary:
          "bg-surface-secondary text-fg-primary hover:bg-border-light border border-border",
        ghost:
          "bg-transparent text-fg-primary hover:bg-surface-secondary",
        "accent-soft":
          "bg-accent-light text-accent hover:bg-accent-light/70",
        danger:
          "bg-error text-white hover:bg-error/90",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-5 text-[15px] rounded-lg",
        lg: "h-14 px-6 text-base rounded-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Иконка слева от текста (lucide-react) */
  leftIcon?: React.ReactNode;
  /** Иконка справа от текста (lucide-react) */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      type = "button",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  },
);

export { buttonVariants };
