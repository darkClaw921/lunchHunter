import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2, Clock, MapPin } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  businessLunches,
  businessLunchDays,
  restaurants,
} from "@/lib/db/schema";
import { haversineDistance } from "@/lib/geo/haversine";
import { formatPrice, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { validateSession } from "@/lib/auth/session";
import { isFavorited } from "@/lib/db/favorites";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

interface PageProps {
  params: Promise<{ id: string }>;
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
  if (days.length === 5 && mask === 0b0011111) return "Пн — Пт";
  if (days.length === 7) return "Пн — Вс";
  return days.join(", ");
}

function isServingNow(
  daysMask: number,
  timeFrom: string,
  timeTo: string,
): boolean {
  const now = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const bit = 1 << (weekday - 1);
  if ((daysMask & bit) === 0) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [fH = 0, fM = 0] = timeFrom.split(":").map(Number);
  const [tH = 0, tM = 0] = timeTo.split(":").map(Number);
  return minutes >= fH * 60 + fM && minutes <= tH * 60 + tM;
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

export default async function BusinessLunchDetailPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const lunch = await db.query.businessLunches.findFirst({
    where: eq(businessLunches.id, numericId),
  });
  if (!lunch) notFound();

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.id, lunch.restaurantId),
  });
  if (!restaurant) notFound();

  const dayRows = await db
    .select()
    .from(businessLunchDays)
    .where(eq(businessLunchDays.lunchId, lunch.id));

  // Aggregate courses across all days → unique list of "course | day variants"
  // Для UI покажем агрегированный список, сгруппированный по порядковой позиции.
  const courseLists = dayRows.map((d) => parseCourses(d.coursesJson));
  const maxLen = courseLists.reduce((m, arr) => Math.max(m, arr.length), 0);
  const groupedCourses: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const variants = new Set<string>();
    for (const list of courseLists) {
      const v = list[i];
      if (v) variants.add(v);
    }
    if (variants.size > 0) groupedCourses.push(Array.from(variants).join(" · "));
  }

  const distance = Math.round(
    haversineDistance(DEFAULT_LAT, DEFAULT_LNG, restaurant.lat, restaurant.lng),
  );

  const servingNow = isServingNow(lunch.daysMask, lunch.timeFrom, lunch.timeTo);

  const session = await validateSession();
  const isAuthenticated = session !== null;
  const lunchFavorited = session
    ? await isFavorited(session.user.id, "lunch", lunch.id)
    : false;

  return (
    <div className="flex flex-col">
      {/* Hero — landing target для shared-element VT. Именование
          `restaurant-image-${restaurant.id}` (numeric id ресторана) —
          совпадает с consumer'ами `restaurant-image-${r.id}` на карточках
          ресторана. Атрибут `data-vt-target` позволяет manualFlipMorph
          на устройствах без VT API находить элемент через querySelector.
          В bussiness-lunch списках VT name пока не назначается, поэтому
          VT-morph сработает только при переходе из страниц ресторана. */}
      <div className="relative">
        {restaurant.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverUrl}
            alt={lunch.name}
            width={1200}
            height={700}
            fetchPriority="high"
            data-vt-target={`restaurant-image-${restaurant.id}`}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
            className="h-[180px] w-full object-cover bg-surface-secondary"
          />
        ) : (
          <div
            data-vt-target={`restaurant-image-${restaurant.id}`}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
            className="h-[180px] w-full bg-surface-secondary grid place-items-center text-fg-muted text-sm"
          >
            {restaurant.category}
          </div>
        )}
        <Link
          href="/business-lunch"
          aria-label="Назад"
          className="absolute top-4 left-4 h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur text-fg-primary shadow-md"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <FavoriteButton
            targetType="lunch"
            targetId={lunch.id}
            initialFavorited={lunchFavorited}
            isAuthenticated={isAuthenticated}
            variant="iconFloating"
          />
          <button
            type="button"
            aria-label="Поделиться"
            className="h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur text-fg-primary shadow-md"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Restaurant name */}
      <div className="px-5 pt-4">
        <h1 className="text-[22px] font-bold text-fg-primary min-h-[1.875rem]">
          {restaurant.name}
        </h1>
      </div>

      {/* Info card (accent) */}
      <div className="px-5 mt-3">
        <div className="rounded-2xl bg-accent text-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[38px] font-extrabold leading-none">
              {formatPrice(lunch.price)}
            </div>
            {servingNow ? (
              <span className="inline-flex items-center h-6 px-3 rounded-full bg-white text-accent text-[12px] font-semibold">
                Сейчас подают
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              {lunch.timeFrom} — {lunch.timeTo}
            </span>
            <span className="opacity-70">·</span>
            <span>{daysMaskToLabel(lunch.daysMask)}</span>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="px-5 mt-5">
        <h2 className="text-[16px] font-semibold text-fg-primary mb-2">
          Что входит:
        </h2>
        <div className="flex flex-col gap-2">
          {groupedCourses.map((course, idx) => {
            const title =
              idx === 0
                ? "Первое"
                : idx === 1
                  ? "Второе"
                  : idx === 2
                    ? "Основное"
                    : idx === 3
                      ? "Напиток"
                      : `Курс ${idx + 1}`;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface-primary p-3"
              >
                <div className="text-[13px] font-semibold text-fg-primary">
                  {title}
                </div>
                <div className="text-[12px] text-fg-secondary mt-0.5">
                  {course}
                </div>
              </div>
            );
          })}
          {groupedCourses.length === 0 ? (
            <div className="text-sm text-fg-muted">
              Состав ланча уточняйте в ресторане
            </div>
          ) : null}
        </div>
      </div>

      {/* Address + distance */}
      <div className="px-5 mt-5 flex items-center gap-2 text-[13px] text-fg-secondary">
        <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
        <span>{restaurant.address}</span>
      </div>
      <div className="px-5 mt-1 text-[13px] text-accent font-medium">
        📍 {formatDistance(distance)} от вас
      </div>

      {/* Actions */}
      <div className="px-5 mt-5 mb-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="lg" fullWidth>
          Маршрут
        </Button>
        <Button variant="primary" size="lg" fullWidth>
          Забронировать
        </Button>
      </div>
    </div>
  );
}
