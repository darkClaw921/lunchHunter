"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { navigate, supportsViewTransitions } from "@/lib/transitions";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";
import {
  useActiveVT,
  ACTIVE_RESTAURANT_VT_STORAGE_KEY,
} from "@/lib/hooks/useActiveVT";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";

export interface NearbyRestaurantsRowItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  rating: number | null;
  distanceMeters: number | null;
  priceAvg: number | null;
  coverUrl: string | null;
}

export interface NearbyRestaurantsRowProps {
  items: NearbyRestaurantsRowItem[];
}

/**
 * NearbyRestaurantsRow — горизонтальный скролл-список карточек
 * "Рядом с вами" для мобильной главной.
 *
 * Реализует shared-element morph через чистый {@link Link} из `next/link`.
 *
 * По ANIMATIONS_GUIDE §9.5.3: `view-transition-name` выставляется **только
 * на активной** карточке — той, по которой кликнули. До клика ни у одной
 * карточки VT-имени нет. В момент клика `useActiveVT.activate(id)` через
 * `flushSync` синхронно проставляет имя в DOM, после чего браузер снимает
 * snapshot «до» с уже именованным элементом и делает morph на hero
 * странице-приёмника. Так исключён риск `InvalidStateError` от дубликата
 * имён между двумя одновременно живыми в DOM страницами при soft-навигации.
 *
 * Для back-навигации используется `sessionStorage`: BackButton на странице
 * ресторана перед `router.back()` зовёт `rememberActiveForBack(...)`,
 * `useActiveVT` в списке при монтировании поднимает id в state.
 *
 * Для Telegram Mini App / старых WebView без VT API — `handleClick` fallback:
 * `navigate()` из `@/lib/transitions` вызывает `manualFlipMorph`
 * (Web Animations API FLIP клон), находя target через
 * `[data-vt-target="restaurant-image-${r.id}"]` на странице детали.
 *
 * Парный landing target — hero-блок в `restaurant/[id]/page.tsx` и
 * `restaurant/[id]/_components/DesktopRestaurantDetail.tsx`.
 */
export function NearbyRestaurantsRow({
  items,
}: NearbyRestaurantsRowProps): React.JSX.Element {
  const { activate, isActive } = useActiveVT<number>(
    ACTIVE_RESTAURANT_VT_STORAGE_KEY,
  );
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
      {items.map((r) => (
        <NearbyRestaurantCard
          key={r.id}
          item={r}
          isActive={isActive(r.id)}
          onActivate={() => activate(r.id)}
        />
      ))}
    </div>
  );
}

function NearbyRestaurantCard({
  item: r,
  isActive,
  onActivate,
}: {
  item: NearbyRestaurantsRowItem;
  isActive: boolean;
  onActivate: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const prefetchImage = usePrefetchImage();
  const href = `/restaurant/${r.slug}`;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    // Проставляем VT-имя только в момент клика — синхронно, чтобы
    // браузер снял snapshot «до» с уже именованным элементом.
    onActivate();
    // На браузерах с VT API переход сработает автоматически через
    // @view-transition { navigation: auto } + именованные элементы.
    if (supportsViewTransitions()) return;
    // Telegram Mini App / старые WebView: ручной FLIP fallback.
    event.preventDefault();
    navigate(router, href, {
      sourceEl: linkRef.current,
      targetSelector: `[data-vt-target="restaurant-image-${r.id}"]`,
    });
  };

  const handlePrefetch = (): void => {
    prefetchImage(r.coverUrl);
  };

  const imageVtStyle = isActive
    ? { viewTransitionName: `restaurant-image-${r.id}` }
    : undefined;
  const titleVtStyle = isActive
    ? { viewTransitionName: `restaurant-title-${r.id}` }
    : undefined;

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onPointerEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      className="w-[160px] shrink-0"
    >
      <Card noPadding interactive className="overflow-hidden">
        <div className="aspect-[4/3] bg-surface-secondary grid place-items-center text-fg-muted text-xs overflow-hidden">
          {r.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.coverUrl}
              alt={r.name}
              width={400}
              height={300}
              loading="lazy"
              style={imageVtStyle}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{r.category}</span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3
              style={titleVtStyle}
              className="text-[13px] font-semibold text-fg-primary truncate min-h-[1rem]"
            >
              {r.name}
            </h3>
            <span className="text-[11px] text-fg-muted shrink-0">
              ★ {formatRating(r.rating)}
            </span>
          </div>
          <p className="text-[11px] text-fg-secondary mt-0.5">{r.category}</p>
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
  );
}

export default NearbyRestaurantsRow;
