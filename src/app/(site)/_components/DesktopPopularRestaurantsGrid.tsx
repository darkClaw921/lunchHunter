"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { navigate, supportsViewTransitions } from "@/lib/transitions";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";
import { formatDistance, formatRating } from "@/lib/utils/format";

export interface DesktopPopularRestaurantsGridItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  rating: number | null;
  distanceMeters: number | null;
  priceAvg: number | null;
  coverUrl: string | null;
}

export interface DesktopPopularRestaurantsGridProps {
  items: DesktopPopularRestaurantsGridItem[];
}

/**
 * DesktopPopularRestaurantsGrid — сетка 4 карточек "Популярные рестораны"
 * в десктопном варианте главной (`DesktopHome`).
 *
 * Shared-element morph через чистый {@link Link} из `next/link` + inline
 * `style={{ viewTransitionName: 'restaurant-image-${r.id}' }}` на обложке
 * и `restaurant-title-${r.id}` на заголовке. В Chrome/Safari с VT API
 * переход сам находит парный элемент на `/restaurant/${slug}` через
 * `@view-transition { navigation: auto }` из globals.css. Имена уникальны
 * per-id, поэтому все 4 карточки сосуществуют без конфликтов.
 *
 * Fallback для Telegram Mini App: `handleClick` обёртка проверяет
 * `supportsViewTransitions()` и при отсутствии API вызывает
 * `navigate(router, href, {sourceEl, targetSelector})`, который запускает
 * manualFlipMorph через Web Animations API. Парный landing — hero в
 * `restaurant/[id]/_components/DesktopRestaurantDetail.tsx` с
 * `data-vt-target="restaurant-image-${restaurant.id}"`.
 */
export function DesktopPopularRestaurantsGrid({
  items,
}: DesktopPopularRestaurantsGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-4 gap-5">
      {items.slice(0, 4).map((r) => (
        <DesktopPopularRestaurantCard key={r.id} item={r} />
      ))}
    </div>
  );
}

function DesktopPopularRestaurantCard({
  item: r,
}: {
  item: DesktopPopularRestaurantsGridItem;
}): React.JSX.Element {
  const router = useRouter();
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const prefetchImage = usePrefetchImage();
  const href = `/restaurant/${r.slug}`;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (supportsViewTransitions()) return;
    event.preventDefault();
    navigate(router, href, {
      sourceEl: linkRef.current,
      targetSelector: `[data-vt-target="restaurant-image-${r.id}"]`,
    });
  };

  const handlePrefetch = (): void => {
    prefetchImage(r.coverUrl);
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onPointerEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      className="group rounded-2xl border border-border-light bg-surface-primary shadow-sm shadow-hover"
    >
      <div className="h-40 w-full bg-surface-secondary overflow-hidden rounded-t-2xl">
        {r.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.coverUrl}
            alt={r.name}
            width={400}
            height={300}
            loading="lazy"
            style={{ viewTransitionName: `restaurant-image-${r.id}` }}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-fg-muted text-sm">
            {r.category}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3
          style={{ viewTransitionName: `restaurant-title-${r.id}` }}
          className="text-[16px] font-semibold text-fg-primary truncate min-h-[1.375rem]"
        >
          {r.name}
        </h3>
        <div className="flex items-center gap-1.5 text-[13px] text-fg-secondary">
          <Star
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          <span className="font-medium">{formatRating(r.rating)}</span>
          <span className="text-fg-muted">·</span>
          <span className="truncate">{r.category}</span>
        </div>
        {r.distanceMeters !== null ? (
          <div className="text-[12px] text-accent font-medium">
            от {formatDistance(r.distanceMeters)}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default DesktopPopularRestaurantsGrid;
