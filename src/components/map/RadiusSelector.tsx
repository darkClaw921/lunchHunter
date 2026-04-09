"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useHaptics } from "@/lib/hooks/useHaptics";

export interface RadiusOption {
  /** Radius value in meters. */
  meters: number;
  /** Display label, e.g. "500м" or "1км". */
  label: string;
}

export const DEFAULT_RADIUS_OPTIONS: readonly RadiusOption[] = [
  { meters: 500, label: "500м" },
  { meters: 1000, label: "1км" },
  { meters: 3000, label: "3км" },
  { meters: 5000, label: "5км" },
] as const;

export interface RadiusSelectorProps {
  /** Currently selected radius (meters). Controlled. */
  value: number;
  /** Called with the new radius (meters) when the user picks a pill. */
  onChange: (meters: number) => void;
  /** Override the available options (defaults to 500/1000/3000/5000). */
  options?: readonly RadiusOption[];
  /** Optional className for the wrapping flex container. */
  className?: string;
  /** Visual size — `md` for mobile, `sm` for desktop overlay. */
  size?: "sm" | "md";
}

/**
 * Pill-shaped segmented selector for choosing a search radius.
 *
 * Active pill uses accent background; inactive pills use surface-secondary
 * with border. Designed to be embedded above a `MapView` (mobile) or
 * floating in the top-left of a desktop split-view map panel.
 *
 * **Press feedback:**
 * - Scale-эффект на :active обеспечивается глобальным правилом в
 *   `globals.css` (`button, a, [role="button"]` → `scale(0.97)`). Pill
 *   рендерится как `<button>`, локальные `active:scale-*` не нужны.
 * - `haptics.selection()` — тактильный отклик при смене радиуса. Не
 *   дёргается, если пользователь тапнул уже активный pill (value не
 *   изменился).
 */
export function RadiusSelector({
  value,
  onChange,
  options = DEFAULT_RADIUS_OPTIONS,
  className,
  size = "md",
}: RadiusSelectorProps): React.JSX.Element {
  const haptics = useHaptics();

  const handleSelect = React.useCallback(
    (meters: number) => {
      // Не дёргаем хаптик, если тапнут уже активный pill — это не смена.
      if (meters !== value) {
        haptics.selection();
      }
      onChange(meters);
    },
    [haptics, onChange, value],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Радиус поиска"
      className={cn("flex gap-2", className)}
    >
      {options.map((opt) => {
        const active = opt.meters === value;
        return (
          <button
            key={opt.meters}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handleSelect(opt.meters)}
            className={cn(
              "inline-flex items-center rounded-full font-semibold transition-colors",
              size === "md" ? "h-9 px-4 text-sm" : "h-7 px-3 text-[12px]",
              active
                ? "bg-accent text-white"
                : "bg-surface-primary border border-border text-fg-primary hover:bg-surface-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default RadiusSelector;
