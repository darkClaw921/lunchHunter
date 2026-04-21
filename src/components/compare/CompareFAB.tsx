"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCompare } from "@/lib/compare/CompareContext";

interface CompareFABProps {
  className?: string;
}

export function CompareFAB({ className }: CompareFABProps): React.JSX.Element | null {
  const { items, clear } = useCompare();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const handleCompare = () => {
    const ids = items.map((l) => l.id).join(",");
    router.push(`/business-lunch/compare?ids=${ids}`);
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 md:bottom-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12 pl-4 pr-2 rounded-full bg-accent text-white shadow-lg">
        <GitCompareArrows className="h-5 w-5 shrink-0" aria-hidden="true" />
        <button
          type="button"
          onClick={handleCompare}
          className="text-[14px] font-semibold whitespace-nowrap"
        >
          Сравнить {items.length}{" "}
          {items.length === 1
            ? "ланч"
            : items.length < 5
              ? "ланча"
              : "ланчей"}
        </button>
        <button
          type="button"
          onClick={clear}
          aria-label="Очистить список сравнения"
          className="ml-1 h-8 w-8 grid place-items-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
