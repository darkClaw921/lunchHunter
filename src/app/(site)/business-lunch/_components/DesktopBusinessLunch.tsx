"use client";

import Link from "next/link";
import { Search, Star, Clock } from "lucide-react";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CompareButton } from "@/components/compare/CompareButton";

export interface DesktopBusinessLunchItem {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  restaurantName: string;
  restaurantSlug: string;
  rating: number | null;
  distanceMeters: number;
  servingNow: boolean;
  courses: string[];
  coverUrl: string | null;
}

export interface DesktopBusinessLunchProps {
  lunches: DesktopBusinessLunchItem[];
  activeOnly: boolean;
  maxPrice: number | null;
  className?: string;
}

interface PriceFilter {
  key: string;
  label: string;
  max: number;
}

const PRICE_FILTERS: readonly PriceFilter[] = [
  { key: "350", label: "до 350 ₽", max: 350 },
  { key: "500", label: "до 500 ₽", max: 500 },
  { key: "700", label: "до 700 ₽", max: 700 },
];

function buildHref(overrides: {
  active?: boolean;
  maxPrice?: number | null;
}): string {
  const sp = new URLSearchParams();
  if (overrides.active) sp.set("active", "true");
  if (overrides.maxPrice) sp.set("maxPrice", String(overrides.maxPrice));
  const qs = sp.toString();
  return qs ? `/business-lunch?${qs}` : "/business-lunch";
}

/**
 * Desktop — Business Lunch (frame vjtMh в lanchHunter.pen).
 *
 * Структура:
 * - Hero-баннер 260px с orange→amber gradient (90deg, #FF5C00→#FF8C00→#FFA500),
 *   заголовок "Бизнес-ланчи рядом с вами" 40/700 белым, подзаголовок,
 *   search bar (radius-full, surface-primary, 640px).
 * - Filter row 56px (surface-primary, border-b): success-outlined "Сейчас
 *   подают" + price pills + "все" + distance + sort.
 * - Grid 3 колонки × 2 ряда (6 карточек) в Bento-стиле: фото 180px вверху,
 *   body с названием (16/700), ценой (28/700 accent), временем, списком
 *   курсов, distance + rating, success-badge "Сейчас подают" поверх фото.
 */
export function DesktopBusinessLunch({
  lunches,
  activeOnly,
  maxPrice,
  className,
}: DesktopBusinessLunchProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center gap-5 px-10 py-12 h-[260px]"
        style={{
          background:
            "linear-gradient(180deg, #FF5C00 0%, #FF8C00 50%, #FFA500 100%)",
        }}
      >
        <h1 className="text-[40px] font-bold text-white text-center leading-tight">
          Бизнес-ланчи рядом с вами
        </h1>
        <p className="text-[16px] text-white/85 text-center max-w-[640px]">
          Найдите лучшие предложения комплексных обедов в вашем районе
        </p>
        <form
          action="/search"
          className="flex items-center gap-2 h-14 w-full max-w-[640px] rounded-full bg-surface-primary pl-6 pr-2 shadow-lg"
        >
          <Search className="h-5 w-5 text-fg-muted" aria-hidden="true" />
          <input
            type="text"
            name="q"
            placeholder="Найти бизнес-ланч, ресторан или кухню..."
            className="flex-1 bg-transparent outline-none text-[15px] text-fg-primary placeholder:text-fg-muted"
          />
          <button
            type="submit"
            className="inline-flex items-center h-10 px-6 rounded-full bg-accent text-white text-[15px] font-semibold hover:bg-accent-dark transition-colors"
          >
            Найти
          </button>
        </form>
      </section>

      {/* Filters row */}
      <div className="flex items-center gap-3 h-14 px-10 bg-surface-primary border-b border-border">
        <Link
          href={buildHref({
            active: !activeOnly,
            maxPrice: maxPrice,
          })}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors",
            activeOnly
              ? "bg-success/10 border-success text-success"
              : "bg-surface-primary border-border text-fg-secondary hover:bg-surface-secondary",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Сейчас подают
        </Link>
        {PRICE_FILTERS.map((pf) => (
          <Link
            key={pf.key}
            href={buildHref({
              active: activeOnly,
              maxPrice: maxPrice === pf.max ? null : pf.max,
            })}
            className={cn(
              "inline-flex items-center h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors",
              maxPrice === pf.max
                ? "bg-accent border-accent text-white"
                : "bg-surface-primary border-border text-fg-secondary hover:bg-surface-secondary",
            )}
          >
            {pf.label}
          </Link>
        ))}
        <Link
          href={buildHref({ active: activeOnly, maxPrice: null })}
          className={cn(
            "inline-flex items-center h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors",
            maxPrice === null
              ? "bg-surface-secondary border-border text-fg-primary"
              : "bg-surface-primary border-border text-fg-secondary hover:bg-surface-secondary",
          )}
        >
          Все
        </Link>
        <div className="flex-1" />
        <span className="text-[13px] text-fg-muted">По рейтингу</span>
      </div>

      {/* Grid */}
      <section className="bg-surface-secondary px-10 py-6">
        {lunches.length === 0 ? (
          <div className="py-16 text-center text-sm text-fg-muted">
            Ничего не найдено
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {lunches.map((l) => (
              <Link
                key={l.id}
                href={{ pathname: `/business-lunch/${l.id}` }}
                className="group rounded-2xl bg-surface-primary border border-border-light shadow-sm shadow-hover flex flex-col"
              >
                {/* Cover */}
                <div className="relative h-[180px] w-full bg-surface-secondary overflow-hidden rounded-t-2xl">
                  {l.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.coverUrl}
                      alt={l.restaurantName}
                      width={400}
                      height={300}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-fg-muted text-sm">
                      {l.restaurantName}
                    </div>
                  )}
                  {l.servingNow ? (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-success text-white text-[11px] font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Сейчас подают
                    </span>
                  ) : null}
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2 p-5">
                  <h3 className="text-[16px] font-bold text-fg-primary truncate min-h-[1.375rem]">
                    {l.restaurantName}
                  </h3>
                  <div className="text-[28px] font-bold text-accent leading-none">
                    {formatPrice(l.price)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-fg-secondary">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {l.timeFrom} — {l.timeTo}
                    </span>
                  </div>
                  <p className="text-[12px] text-fg-secondary line-clamp-2 min-h-[32px]">
                    {l.courses.length > 0 ? l.courses.join(" · ") : l.name}
                  </p>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-border-light">
                    <span className="text-[12px] text-fg-muted">
                      {formatDistance(l.distanceMeters)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[12px] text-fg-secondary">
                      <Star
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      {formatRating(l.rating)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <CompareButton lunch={l} variant="card" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DesktopBusinessLunch;
