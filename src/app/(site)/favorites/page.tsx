import Link from "next/link";
import { Heart, MapPin, Star, Clock, UtensilsCrossed } from "lucide-react";
import { validateSession } from "@/lib/auth/session";
import { getUserFavorites } from "@/lib/db/favorites";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRating, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

/**
 * Favorites page — избранное пользователя по трём типам: рестораны, блюда
 * (позиции меню) и бизнес-ланчи. Server component, читает сессию через
 * `validateSession`, данные грузит через `getUserFavorites`.
 *
 * Состояния:
 * - Гость: CTA на /profile (Telegram login).
 * - Залогинен, но избранное пусто: пустое состояние с CTA на /.
 * - Залогинен с данными: три секции — Рестораны / Блюда / Бизнес-ланчи
 *   (каждая показывается только если непуста).
 */
export default async function FavoritesPage(): Promise<React.JSX.Element> {
  const session = await validateSession();

  if (!session) {
    return <GuestState />;
  }

  const { restaurants, menuItems, lunches } = await getUserFavorites(
    session.user.id,
  );
  const total = restaurants.length + menuItems.length + lunches.length;

  if (total === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <section className="hidden md:block bg-surface-secondary px-12 py-12">
        <h1 className="text-[36px] font-bold text-fg-primary leading-tight">
          Избранное
        </h1>
        <p className="mt-2 text-[16px] text-fg-secondary">
          {total} сохранённых элементов
        </p>
      </section>
      {/* Mobile header */}
      <header className="md:hidden px-5 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-fg-primary">Избранное</h1>
        <p className="mt-0.5 text-[13px] text-fg-secondary">
          {total} сохранённых
        </p>
      </header>

      <div className="flex flex-col gap-8 md:gap-10 px-5 md:px-12 pb-8 md:pb-12">
        {restaurants.length > 0 ? (
          <section>
            <SectionTitle title="Рестораны" count={restaurants.length} />
            {/* Desktop */}
            <div className="hidden md:grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {restaurants.map((r) => (
                <RestaurantCardDesktop key={r.id} r={r} />
              ))}
            </div>
            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-3">
              {restaurants.map((r) => (
                <RestaurantCardMobile key={r.id} r={r} />
              ))}
            </div>
          </section>
        ) : null}

        {menuItems.length > 0 ? (
          <section>
            <SectionTitle title="Блюда" count={menuItems.length} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {menuItems.map((i) => (
                <Link
                  key={i.id}
                  href={{ pathname: `/restaurant/${i.restaurantSlug}` }}
                  className="block"
                >
                  <Card noPadding interactive className="overflow-hidden">
                    <div className="flex gap-3">
                      <div className="h-24 w-24 shrink-0 bg-surface-secondary grid place-items-center text-fg-muted">
                        {i.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.photoUrl}
                            alt={i.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UtensilsCrossed
                            className="h-6 w-6"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-2.5 pr-3">
                        <h3 className="text-[14px] font-semibold text-fg-primary line-clamp-1">
                          {i.name}
                        </h3>
                        <div className="text-[11px] text-fg-secondary line-clamp-1 mt-0.5">
                          {i.restaurantName}
                        </div>
                        {i.description ? (
                          <div className="text-[11px] text-fg-muted line-clamp-1 mt-0.5">
                            {i.description}
                          </div>
                        ) : null}
                        <div className="mt-1.5 text-[14px] font-bold text-accent">
                          {formatPrice(i.price)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {lunches.length > 0 ? (
          <section>
            <SectionTitle title="Бизнес-ланчи" count={lunches.length} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lunches.map((l) => (
                <Link
                  key={l.id}
                  href={{ pathname: `/business-lunch/${l.id}` }}
                  className="block"
                >
                  <Card noPadding interactive className="overflow-hidden">
                    <div className="flex gap-3">
                      <div className="h-24 w-24 shrink-0 bg-surface-secondary overflow-hidden">
                        {l.restaurantCoverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={l.restaurantCoverUrl}
                            alt={l.restaurantName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-fg-muted text-[10px]">
                            {l.restaurantName}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-2.5 pr-3">
                        <h3 className="text-[14px] font-semibold text-fg-primary line-clamp-1">
                          {l.name}
                        </h3>
                        <div className="text-[11px] text-fg-secondary line-clamp-1 mt-0.5">
                          {l.restaurantName}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-fg-secondary">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <span>
                            {l.timeFrom} — {l.timeTo}
                          </span>
                        </div>
                        <div className="mt-1 text-[14px] font-bold text-accent">
                          {formatPrice(l.price)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  count,
}: {
  title: string;
  count: number;
}): React.JSX.Element {
  return (
    <div className="mb-3 md:mb-4 flex items-baseline gap-2">
      <h2 className="text-[17px] md:text-[22px] font-bold text-fg-primary">
        {title}
      </h2>
      <span className="text-[12px] md:text-[14px] text-fg-muted">{count}</span>
    </div>
  );
}

interface FavoriteRestaurantProps {
  r: {
    id: number;
    slug: string;
    name: string;
    category: string;
    address: string;
    rating: number | null;
    coverUrl: string | null;
  };
}

function RestaurantCardDesktop({
  r,
}: FavoriteRestaurantProps): React.JSX.Element {
  return (
    <Link
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
            <span className="font-medium">{formatRating(r.rating)}</span>
          </span>
        </div>
        <Badge variant="neutral" className="self-start">
          {r.category}
        </Badge>
        <div className="flex items-start gap-1.5 text-[12px] text-fg-secondary">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{r.address}</span>
        </div>
      </div>
    </Link>
  );
}

function RestaurantCardMobile({
  r,
}: FavoriteRestaurantProps): React.JSX.Element {
  return (
    <Link href={{ pathname: `/restaurant/${r.slug}` }} className="block">
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
            <Badge variant="neutral" className="mt-1 text-[10px] py-0">
              {r.category}
            </Badge>
            <div className="mt-1.5 flex items-start gap-1 text-[11px] text-fg-secondary">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{r.address}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function GuestState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center min-h-[60vh]">
      <div className="h-24 w-24 rounded-full bg-accent-light grid place-items-center mb-6">
        <Heart
          className="h-12 w-12 text-accent"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="text-[22px] font-bold text-fg-primary">
        Войдите чтобы сохранять избранное
      </h2>
      <p className="mt-2 text-[14px] text-fg-secondary max-w-[360px]">
        Сохраняйте рестораны, блюда и бизнес-ланчи — они появятся здесь
      </p>
      <Link
        href="/profile"
        className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded-full bg-accent text-white font-semibold text-[14px] hover:bg-accent-dark transition-colors"
      >
        Войти через Telegram
      </Link>
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center min-h-[60vh]">
      <div className="h-24 w-24 rounded-full bg-surface-secondary grid place-items-center mb-6">
        <Heart
          className="h-12 w-12 text-fg-muted"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="text-[22px] font-bold text-fg-primary">
        У вас пока нет избранного
      </h2>
      <p className="mt-2 text-[14px] text-fg-secondary max-w-[360px]">
        Нажимайте на сердечки рядом с ресторанами, блюдами и бизнес-ланчами,
        чтобы добавлять их сюда
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded-full bg-accent text-white font-semibold text-[14px] hover:bg-accent-dark transition-colors"
      >
        Найти рестораны
      </Link>
    </div>
  );
}
