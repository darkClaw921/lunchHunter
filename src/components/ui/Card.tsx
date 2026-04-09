import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Card — базовая поверхность по pencil lanchHunter.pen.
 * - bg-surface-primary
 * - border #E5E7EB
 * - radius-lg (16px)
 * - лёгкая тень
 *
 * Подкомпоненты CardHeader/CardBody/CardFooter для композиции
 * (используется для ResultCard, LunchCard, StatCard на dashboard).
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Убирает padding (например если внутри медиа-блок на всю ширину). */
  noPadding?: boolean;
  /** Интерактивная карточка (hover + cursor pointer). */
  interactive?: boolean;
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, noPadding = false, interactive = false, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface-primary border border-border rounded-lg",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        !noPadding && "p-4",
        interactive &&
          "transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 mb-3", className)}
      {...props}
    />
  );
});

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-fg-primary", className)}
      {...props}
    />
  );
});

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-fg-secondary", className)}
      {...props}
    />
  );
});

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardBody({ className, ...props }, ref) {
  return <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />;
});

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between mt-3", className)}
      {...props}
    />
  );
});
