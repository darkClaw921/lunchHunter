"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AVAILABLE_CITIES } from "@/lib/cities";

export { AVAILABLE_CITIES };

interface CityPickerProps {
  currentCity: string | null;
  cities: readonly string[];
}

/**
 * Клиентский выбор города. Оптимистично обновляет выделение, шлёт POST
 * на /api/profile/city и рефрешит страницу при успехе.
 */
export function CityPicker({
  currentCity,
  cities,
}: CityPickerProps): React.JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(currentCity);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSelect(city: string): Promise<void> {
    if (pending || city === selected) return;
    setPending(city);
    setError(null);
    const previous = selected;
    setSelected(city);
    try {
      const res = await fetch("/api/profile/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
      if (!res.ok) {
        setSelected(previous);
        setError("Не удалось сохранить город");
        return;
      }
      router.refresh();
    } catch {
      setSelected(previous);
      setError("Ошибка сети");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      {error ? (
        <div className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-[13px] text-error">
          {error}
        </div>
      ) : null}
      <ul className="flex flex-col gap-2">
        {cities.map((city) => {
          const isSelected = city === selected;
          const isPending = city === pending;
          return (
            <li key={city}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                disabled={pending !== null}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 h-14 text-left transition-colors",
                  isSelected
                    ? "border-accent bg-accent-light"
                    : "border-border bg-surface-primary hover:bg-surface-secondary",
                  pending !== null && !isPending && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "h-9 w-9 rounded-full grid place-items-center shrink-0",
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-accent-light text-accent",
                  )}
                >
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex-1 text-[14px] font-medium text-fg-primary">
                  {city}
                </span>
                {isSelected ? (
                  <Check
                    className="h-5 w-5 text-accent shrink-0"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
