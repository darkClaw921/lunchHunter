"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRating } from "@/lib/utils/format";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";

/**
 * Restaurant index cards — client-компоненты для страницы списка ресторанов
 * `/restaurant`. Вынесены в отдельный файл, чтобы `restaurant/page.tsx`
 * оставался серверным (читает данные через `getNearbyRestaurants`), а
 * сами карточки могли использовать client-only хук
 * {@link usePrefetchImage} для предзагрузки hi-res hero-картинки на
 * onPointerEnter/onPointerDown (long-press prefetch, ANIMATIONS_GUIDE §9).
 *
 * Два варианта вёрстки (та же модель данных):
 * - {@link RestaurantIndexCardDesktop} — 16:10 hero + title + rating
 *   + category badge + address. Hover: group-hover scale transform.
 * - {@link RestaurantIndexCardMobile} — 96×96 thumb слева + title / rating
 *   / category / address в правой колонке. Внутри {@link Card} wrapper.
 */

export interface RestaurantIndexItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  address: string;
  rating: number | null;
  coverUrl: string | null;
}

export function RestaurantIndexCardDesktop({
  r,
}: {
  r: RestaurantIndexItem;
}): React.JSX.Element {
  const prefetchImage = usePrefetchImage();
  const handlePrefetch = (): void => {
    prefetchImage(r.coverUrl);
  };

  return (
    <Link
      href={{ pathname: `/restaurant/${r.slug}` }}
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
          <h3 className="text-[16px] font-semibold text-fg-primary truncate min-h-[1.375rem]">
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

export function RestaurantIndexCardMobile({
  r,
}: {
  r: RestaurantIndexItem;
}): React.JSX.Element {
  const prefetchImage = usePrefetchImage();
  const handlePrefetch = (): void => {
    prefetchImage(r.coverUrl);
  };

  return (
    <Link
      href={{ pathname: `/restaurant/${r.slug}` }}
      onPointerEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      className="block"
    >
      <Card noPadding interactive>
        <div className="flex gap-3">
          <div className="h-24 w-24 shrink-0 bg-surface-secondary grid place-items-center text-fg-muted text-[10px] overflow-hidden rounded-l-lg">
            {r.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.coverUrl}
                alt={r.name}
                width={160}
                height={160}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{r.category}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 py-2.5 pr-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-fg-primary truncate min-h-[1.125rem]">
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
