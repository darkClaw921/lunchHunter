import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchHomeForm } from "./_components/SearchHomeForm";
import { DesktopHome } from "./_components/DesktopHome";
import { PWAInstallBanner } from "@/components/mobile/PWAInstallBanner";
import {
  getNearbyRestaurants,
  getPopularQueries,
  getFeaturedBusinessLunches,
  getFeaturedMenuItems,
  getMinBusinessLunchPrice,
} from "@/lib/db/queries";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

// Moscow center (Red Square) fallback коорд.
const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

const CATEGORIES = [
  { key: "bars", label: "Бары" },
  { key: "cafe", label: "Кафе" },
  { key: "rest", label: "Рестораны" },
  { key: "fast", label: "Фастфуд" },
];

export default async function HomePage(): Promise<React.JSX.Element> {
  const [nearby, popular, featuredLunches, featuredMenu, minLunchPrice] =
    await Promise.all([
      getNearbyRestaurants({
        userLat: DEFAULT_LAT,
        userLng: DEFAULT_LNG,
        limit: 8,
      }),
      getPopularQueries(6),
      getFeaturedBusinessLunches(3),
      getFeaturedMenuItems(4),
      getMinBusinessLunchPrice(),
    ]);

  return (
    <>
      <DesktopHome
        popularRestaurants={nearby.slice(0, 4).map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          category: r.category,
          rating: r.rating,
          distanceMeters: r.distanceMeters,
          priceAvg: r.priceAvg,
          coverUrl: r.coverUrl,
        }))}
        heroMenuItems={featuredMenu}
        heroLunches={featuredLunches}
        className="hidden md:flex"
      />
      <div className="flex flex-col md:hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-white font-bold text-sm">
            LH
          </div>
          <span className="text-[19px] font-semibold tracking-tight text-fg-primary">
            lancHunter
          </span>
        </Link>
        <button
          type="button"
          aria-label="Уведомления"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-secondary hover:bg-surface-secondary transition-colors"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="px-5">
        <SearchHomeForm placeholder="Пиво, суши, кофе..." />
      </div>

      {/* Categories */}
      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c, i) => (
            <Chip key={c.key} active={i === 0}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Popular queries */}
      <section className="px-5 mt-5">
        <h2 className="text-[15px] font-semibold text-fg-primary mb-2">
          Популярные запросы
        </h2>
        <div className="flex flex-wrap gap-2">
          {popular.map((p) => (
            <Link
              key={p.query}
              href={{ pathname: "/search", query: { q: p.query } }}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium bg-accent-light text-accent hover:bg-accent-light/70 transition-colors capitalize"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {p.query}
            </Link>
          ))}
        </div>
      </section>

      {/* Business-lunch banner */}
      <section className="px-5 mt-5">
        <Link href="/business-lunch" className="block">
          <div className="rounded-xl bg-accent text-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Badge variant="success" dot className="bg-white text-accent">
                Сейчас подают
              </Badge>
              <span className="text-xs font-medium text-white/90">
                Смотреть все →
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl">🍽</span>
              <h3 className="text-[20px] font-bold leading-tight">
                Бизнес-ланчи рядом
              </h3>
            </div>
            <p className="text-[13px] text-white/90 mt-1">
              Лучшие предложения
              {minLunchPrice !== null ? ` от ${formatPrice(minLunchPrice)}` : ""}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {featuredLunches.slice(0, 3).map((lunch) => (
                <div
                  key={lunch.id}
                  className="rounded-lg bg-accent-dark/70 p-2 text-white"
                >
                  <div className="text-[11px] font-semibold truncate">
                    {lunch.restaurantName}
                  </div>
                  <div className="text-[13px] font-bold mt-0.5">
                    от {formatPrice(lunch.price)}
                  </div>
                  <div className="text-[10px] text-white/80 mt-0.5">
                    {lunch.timeFrom}–{lunch.timeTo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </section>

      {/* Nearby */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-semibold text-fg-primary">
            Рядом с вами
          </h2>
          <Link
            href="/search"
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Все
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {nearby.map((r) => (
            <Link
              key={r.id}
              href={{ pathname: `/restaurant/${r.slug}` }}
              className="w-[160px] shrink-0"
            >
              <Card noPadding interactive className="overflow-hidden">
                <div className="aspect-[4/3] bg-surface-secondary grid place-items-center text-fg-muted text-xs">
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
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-fg-primary truncate">
                      {r.name}
                    </h3>
                    <span className="text-[11px] text-fg-muted shrink-0">
                      ★ {formatRating(r.rating)}
                    </span>
                  </div>
                  <p className="text-[11px] text-fg-secondary mt-0.5">
                    {r.category}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-fg-muted">
                      {formatDistance(r.distanceMeters)}
                    </span>
                    {r.priceAvg !== null ? (
                      <span className="text-[11px] font-medium text-fg-secondary">
                        ~{formatPrice(r.priceAvg)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      {/* PWA install prompt — shown on mobile home only, hides itself when
          the browser does not fire beforeinstallprompt or the app is already
          installed. Positioned fixed above the BottomTabBar. */}
      <PWAInstallBanner className="md:hidden" />
      </div>
    </>
  );
}
