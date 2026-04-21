import Link from "next/link";
import { ArrowLeft, Star, Clock, MapPin, Check, X as XIcon } from "lucide-react";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sqlite } from "@/lib/db/client";
import { businessLunches, businessLunchDays, restaurants } from "@/lib/db/schema";
import { haversineDistance } from "@/lib/geo/haversine";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

interface DayRow {
  lunch_id: number;
  courses_json: string;
}

function parseCourses(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    return [];
  }
  return [];
}

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function daysMaskToLabel(mask: number): string {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    if ((mask & (1 << i)) !== 0) {
      const label = WEEKDAY_LABELS[i];
      if (label) days.push(label);
    }
  }
  if (days.length === 5 && mask === 0b0011111) return "Пн–Пт";
  if (days.length === 7) return "Пн–Вс";
  return days.join(", ");
}

function isServingNow(daysMask: number, timeFrom: string, timeTo: string): boolean {
  const now = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const bit = 1 << (weekday - 1);
  if ((daysMask & bit) === 0) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [fH = 0, fM = 0] = timeFrom.split(":").map(Number);
  const [tH = 0, tM = 0] = timeTo.split(":").map(Number);
  return minutes >= fH * 60 + fM && minutes <= tH * 60 + tM;
}

interface LunchData {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  daysMask: number;
  restaurantName: string;
  restaurantSlug: string;
  address: string;
  rating: number | null;
  distanceMeters: number;
  servingNow: boolean;
  courses: string[];
  coverUrl: string | null;
}

async function loadLunchData(ids: number[]): Promise<LunchData[]> {
  if (ids.length === 0) return [];

  const lunchRows = await db.query.businessLunches.findMany({
    where: inArray(businessLunches.id, ids),
  });

  const restaurantIds = [...new Set(lunchRows.map((l) => l.restaurantId))];
  const restaurantRows = await db.query.restaurants.findMany({
    where: inArray(restaurants.id, restaurantIds),
  });
  const restaurantMap = new Map(restaurantRows.map((r) => [r.id, r]));

  const now = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();

  const placeholders = ids.map(() => "?").join(",");
  const dayRows = sqlite
    .prepare(
      `SELECT lunch_id, courses_json FROM business_lunch_days
       WHERE lunch_id IN (${placeholders}) AND weekday = ?`,
    )
    .all(...ids, weekday) as DayRow[];

  const coursesByLunchId = new Map<number, string[]>();
  for (const d of dayRows) {
    coursesByLunchId.set(d.lunch_id, parseCourses(d.courses_json));
  }

  const result: LunchData[] = [];
  for (const lunch of lunchRows) {
    const restaurant = restaurantMap.get(lunch.restaurantId);
    if (!restaurant) continue;
    result.push({
      id: lunch.id,
      name: lunch.name,
      price: lunch.price,
      timeFrom: lunch.timeFrom,
      timeTo: lunch.timeTo,
      daysMask: lunch.daysMask,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
      address: restaurant.address,
      rating: restaurant.rating,
      distanceMeters: Math.round(
        haversineDistance(DEFAULT_LAT, DEFAULT_LNG, restaurant.lat, restaurant.lng),
      ),
      servingNow: isServingNow(lunch.daysMask, lunch.timeFrom, lunch.timeTo),
      courses: coursesByLunchId.get(lunch.id) ?? [],
      coverUrl: restaurant.coverUrl,
    });
  }

  // Preserve original order from URL
  result.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return result;
}

function BestBadge({ label }: { label: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full bg-success/15 text-success text-[10px] font-semibold">
      {label}
    </span>
  );
}

function WorstBadge({ label }: { label: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full bg-error/10 text-error text-[10px] font-semibold">
      {label}
    </span>
  );
}

interface CompareRowProps {
  label: string;
  values: React.ReactNode[];
  highlight?: number; // index of best value
  lowlight?: number; // index of worst value
}

function CompareRow({ label, values, highlight, lowlight }: CompareRowProps): React.JSX.Element {
  return (
    <div className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
      <div className="px-3 py-3 text-[12px] font-semibold text-fg-muted bg-surface-secondary border-r border-border flex items-center">
        {label}
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          className={cn(
            "px-3 py-3 text-[13px] text-fg-primary border-r border-border last:border-r-0 flex flex-col gap-1",
            i === highlight && "bg-success/5",
            i === lowlight && i !== highlight && "bg-error/5",
          )}
        >
          {val}
        </div>
      ))}
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const rawIds = params.ids ?? "";
  const ids = rawIds
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 4);

  const lunches = await loadLunchData(ids);

  const minPrice = lunches.length > 0 ? Math.min(...lunches.map((l) => l.price)) : null;
  const maxPrice = lunches.length > 0 ? Math.max(...lunches.map((l) => l.price)) : null;
  const minDist = lunches.length > 0 ? Math.min(...lunches.map((l) => l.distanceMeters)) : null;
  const maxDist = lunches.length > 0 ? Math.max(...lunches.map((l) => l.distanceMeters)) : null;
  const ratings = lunches.map((l) => l.rating).filter((r): r is number => r !== null);
  const maxRating = ratings.length > 0 ? Math.max(...ratings) : null;
  const minRating = ratings.length > 0 ? Math.min(...ratings) : null;

  const colCount = Math.max(lunches.length, 1);

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-primary border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            href="/business-lunch"
            aria-label="Назад"
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-secondary text-fg-primary"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-[17px] font-bold text-fg-primary">Сравнение ланчей</h1>
        </div>
      </div>

      {lunches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 py-16">
          <p className="text-fg-muted text-sm text-center">
            Нет ланчей для сравнения.
            <br />
            Добавьте ланчи из списка.
          </p>
          <Link
            href="/business-lunch"
            className="inline-flex items-center h-10 px-6 rounded-full bg-accent text-white text-[14px] font-semibold"
          >
            К списку ланчей
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Cover + name headers */}
          <div
            className="grid min-w-max"
            style={{ gridTemplateColumns: `140px repeat(${colCount}, minmax(160px, 1fr))` }}
          >
            {/* top-left empty cell */}
            <div className="bg-surface-secondary border-b border-r border-border" />
            {lunches.map((l) => (
              <div
                key={l.id}
                className="bg-surface-primary border-b border-r border-border last:border-r-0 flex flex-col"
              >
                {/* Cover */}
                <div className="relative h-[120px] bg-surface-secondary overflow-hidden">
                  {l.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.coverUrl}
                      alt={l.restaurantName}
                      width={320}
                      height={180}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-fg-muted text-xs">
                      {l.restaurantName}
                    </div>
                  )}
                  {l.servingNow ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 h-5 px-2 rounded-full bg-success text-white text-[10px] font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Сейчас
                    </span>
                  ) : null}
                </div>

                {/* Name */}
                <div className="px-3 py-2">
                  <Link
                    href={`/business-lunch/${l.id}`}
                    className="text-[13px] font-bold text-fg-primary hover:text-accent line-clamp-2"
                  >
                    {l.restaurantName}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison rows table */}
          <div
            className="grid min-w-max"
            style={{ gridTemplateColumns: `140px repeat(${colCount}, minmax(160px, 1fr))` }}
          >
            {/* Price */}
            <CompareRow
              label="Цена"
              values={lunches.map((l) => (
                <div className="flex flex-col gap-0.5">
                  <span className={cn("text-[17px] font-bold", l.price === minPrice ? "text-accent" : "text-fg-primary")}>
                    {formatPrice(l.price)}
                  </span>
                  {l.price === minPrice && lunches.length > 1 && <BestBadge label="Дешевле" />}
                  {l.price === maxPrice && l.price !== minPrice && <WorstBadge label="Дороже" />}
                </div>
              ))}
            />

            {/* Distance */}
            <CompareRow
              label="Расстояние"
              values={lunches.map((l) => (
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                    <span className={cn(l.distanceMeters === minDist ? "font-semibold text-fg-primary" : "text-fg-secondary")}>
                      {formatDistance(l.distanceMeters)}
                    </span>
                  </span>
                  {l.distanceMeters === minDist && lunches.length > 1 && <BestBadge label="Ближе" />}
                  {l.distanceMeters === maxDist && l.distanceMeters !== minDist && <WorstBadge label="Дальше" />}
                </div>
              ))}
            />

            {/* Rating */}
            <CompareRow
              label="Рейтинг"
              values={lunches.map((l) => (
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                    <span className={cn(l.rating === maxRating && maxRating !== null ? "font-semibold text-fg-primary" : "text-fg-secondary")}>
                      {formatRating(l.rating)}
                    </span>
                  </span>
                  {l.rating === maxRating && maxRating !== null && lunches.length > 1 && <BestBadge label="Выше" />}
                  {l.rating === minRating && l.rating !== maxRating && minRating !== null && <WorstBadge label="Ниже" />}
                </div>
              ))}
            />

            {/* Time */}
            <CompareRow
              label="Время"
              values={lunches.map((l) => (
                <span className="flex items-center gap-1 text-fg-secondary">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {l.timeFrom}–{l.timeTo}
                </span>
              ))}
            />

            {/* Days */}
            <CompareRow
              label="Дни"
              values={lunches.map((l) => (
                <span className="text-fg-secondary text-[12px]">
                  {daysMaskToLabel(l.daysMask)}
                </span>
              ))}
            />

            {/* Serving now */}
            <CompareRow
              label="Сейчас подают"
              values={lunches.map((l) =>
                l.servingNow ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[12px] font-medium">Да</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-fg-muted">
                    <XIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[12px]">Нет</span>
                  </span>
                ),
              )}
            />

            {/* Address */}
            <CompareRow
              label="Адрес"
              values={lunches.map((l) => (
                <span className="text-[12px] text-fg-secondary leading-snug">{l.address}</span>
              ))}
            />

            {/* Courses */}
            <CompareRow
              label="Меню"
              values={lunches.map((l) => (
                <div className="flex flex-col gap-1">
                  {l.courses.length > 0 ? (
                    l.courses.map((c, i) => {
                      const courseLabel =
                        i === 0 ? "1-е:" : i === 1 ? "2-е:" : i === 2 ? "Основное:" : i === 3 ? "Напиток:" : `${i + 1}:`;
                      return (
                        <div key={i} className="text-[11px]">
                          <span className="font-semibold text-fg-muted">{courseLabel} </span>
                          <span className="text-fg-primary">{c}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[12px] text-fg-muted italic">Уточняйте в ресторане</span>
                  )}
                </div>
              ))}
            />
          </div>

          {/* CTA row */}
          <div
            className="grid min-w-max border-t border-border"
            style={{ gridTemplateColumns: `140px repeat(${colCount}, minmax(160px, 1fr))` }}
          >
            <div className="bg-surface-secondary border-r border-border" />
            {lunches.map((l) => (
              <div key={l.id} className="px-3 py-3 bg-surface-primary border-r border-border last:border-r-0">
                <Link
                  href={`/business-lunch/${l.id}`}
                  className="block w-full text-center h-9 leading-9 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent/90 transition-colors"
                >
                  Подробнее
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
