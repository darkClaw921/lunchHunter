import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getNearbyRestaurants } from "@/lib/db/queries";
import { formatRating } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

/**
 * Restaurant index page — список всех опубликованных ресторанов.
 *
 * Используется ссылкой "Рестораны" из TopNav (desktop) и доступен напрямую.
 * Server component, читает данные через `getNearbyRestaurants`.
 *
 * Layout:
 * - Mobile (`<md`): вертикальный список карточек, по дизайну похож на
 *   секцию «Рядом с вами» Home, но в полноразмерном вертикальном виде.
 * - Desktop (`md+`): сетка `xl:grid-cols-4 md:grid-cols-2`, аналогичная
 *   секции «Популярные рестораны» из DesktopHome.
 */
export default async function RestaurantIndexPage(): Promise<React.JSX.Element> {
  const restaurants = await getNearbyRestaurants({
    userLat: DEFAULT_LAT,
    userLng: DEFAULT_LNG,
    limit: 50,
  });

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-col">
        <section className="bg-surface-secondary px-12 py-12">
          <h1 className="text-[36px] font-bold text-fg-primary leading-tight">
            Все рестораны
          </h1>
          <p className="mt-2 text-[16px] text-fg-secondary">
            {restaurants.length} мест рядом с вами
          </p>
        </section>

        <section className="px-12 py-10">
          {restaurants.length === 0 ? (
            <div className="py-20 text-center text-fg-muted">
              Пока нет опубликованных ресторанов
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {restaurants.map((r) => (
                <Link
                  key={r.id}
                  href={{ pathname: `/restaurant/${r.slug}` }}
                  className="group rounded-2xl border border-border-light bg-surface-primary shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="h-40 w-full bg-surface-secondary overflow-hidden">
                    {r.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.coverUrl}
                        alt={r.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-fg-muted text-sm">
                        {r.category}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[16px] font-semibold text-fg-primary truncate">
                        {r.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[13px] text-fg-secondary shrink-0">
                        <Star
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                          aria-hidden="true"
                        />
                        <span className="font-medium">
                          {formatRating(r.rating)}
                        </span>
                      </span>
                    </div>
                    <Badge variant="neutral" className="self-start">
                      {r.category}
                    </Badge>
                    <div className="flex items-start gap-1.5 text-[12px] text-fg-secondary">
                      <MapPin
                        className="h-3.5 w-3.5 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2">{r.address}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-[22px] font-bold text-fg-primary">
            Все рестораны
          </h1>
          <p className="mt-0.5 text-[13px] text-fg-secondary">
            {restaurants.length} мест рядом
          </p>
        </header>

        <div className="px-5 pb-6 flex flex-col gap-3">
          {restaurants.length === 0 ? (
            <div className="py-10 text-center text-sm text-fg-muted">
              Пока нет опубликованных ресторанов
            </div>
          ) : (
            restaurants.map((r) => (
              <Link
                key={r.id}
                href={{ pathname: `/restaurant/${r.slug}` }}
                className="block"
              >
                <Card noPadding interactive className="overflow-hidden">
                  <div className="flex gap-3">
                    <div className="h-24 w-24 shrink-0 bg-surface-secondary grid place-items-center text-fg-muted text-[10px]">
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.coverUrl}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{r.category}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-2.5 pr-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[14px] font-semibold text-fg-primary truncate">
                          {r.name}
                        </h3>
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-fg-secondary shrink-0">
                          <Star
                            className="h-3 w-3 fill-amber-400 text-amber-400"
                            aria-hidden="true"
                          />
                          {formatRating(r.rating)}
                        </span>
                      </div>
                      <Badge
                        variant="neutral"
                        className="mt-1 text-[10px] py-0"
                      >
                        {r.category}
                      </Badge>
                      <div className="mt-1.5 flex items-start gap-1 text-[11px] text-fg-secondary">
                        <MapPin
                          className="h-3 w-3 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="line-clamp-2">{r.address}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
