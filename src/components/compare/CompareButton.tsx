"use client";

import * as React from "react";
import { GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCompare, type CompareLunch } from "@/lib/compare/CompareContext";

interface CompareButtonProps {
  lunch: CompareLunch;
  variant?: "card" | "floating";
  className?: string;
}

export function CompareButton({
  lunch,
  variant = "card",
  className,
}: CompareButtonProps): React.JSX.Element {
  const { toggle, has } = useCompare();
  const active = has(lunch.id);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(lunch);
    },
    [toggle, lunch],
  );

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Убрать из сравнения" : "Добавить в сравнение"}
        className={cn(
          "h-10 w-10 grid place-items-center rounded-full backdrop-blur shadow-md transition-colors",
          active
            ? "bg-accent text-white"
            : "bg-white/90 text-fg-primary",
          className,
        )}
      >
        <GitCompareArrows className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Убрать из сравнения" : "Добавить в сравнение"}
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium transition-colors border",
        active
          ? "bg-accent text-white border-accent"
          : "bg-surface-primary text-fg-secondary border-border hover:border-accent hover:text-accent",
        className,
      )}
    >
      <GitCompareArrows className="h-3 w-3" aria-hidden="true" />
      {active ? "В сравнении" : "Сравнить"}
    </button>
  );
}
