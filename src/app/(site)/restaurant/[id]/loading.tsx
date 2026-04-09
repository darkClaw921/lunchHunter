"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/restaurant/[id]/loading.tsx — скелет страницы ресторана.
 *
 * Повторяет структуру реального `page.tsx`:
 * - Mobile (<md): hero 4:3 + back-кнопка, блок info (название, rating,
 *   адрес), заголовок "Меню", Tabs placeholder, 4 карточки блюд.
 * - Desktop (≥md): back row, hero 220px, info row, двухколоночный layout
 *   (левая колонка — меню с Tabs + 4 карточки, правая колонка 420px —
 *   "Местоположение" с mini-map + "Отзывы").
 *
 * Client component — использует {@link useParams} из `next/navigation`
 * чтобы получить `[id]` из URL и назначить `viewTransitionName:
 * 'restaurant-image-${id}'` на hero-скелет. Такое же имя на обложке
 * карточки-источника (см. `NearbyRestaurantsRow`, `MobileSearchResults`,
 * `DesktopSearchResults`, `DesktopPopularRestaurantsGrid`, `MobileMapView`)
 * даёт браузеру shared-element morph через
 * `@view-transition { navigation: auto }` из globals.css.
 *
 * ⚠️ Тонкость: консьюмеры используют numeric `restaurant.id` в имени
 * (`restaurant-image-${r.id}`). Если URL — slug (`/restaurant/abc-slug`),
 * то `useParams().id === "abc-slug"` и имя не совпадёт с картой. В этом
 * случае VT API просто делает root cross-fade (деградация корректна).
 * Для morph через slug-URL требуется выравнивание имён на слаге — см.
 * Phase 10 аудит.
 *
 * Пара mobile и desktop одновременно — `md:hidden` / `hidden md:flex`.
 */
export default function RestaurantDetailLoading(): React.JSX.Element {
  const params = useParams();
  const rawId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined;
  const vtImageName = rawId ? `restaurant-image-${rawId}` : undefined;
  const vtTargetValue = rawId ? `restaurant-image-${rawId}` : undefined;

  return (
    <>
      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        {/* Hero 4:3 — VT landing target */}
        <div className="relative">
          <div
            className="aspect-[4/3] w-full bg-surface-secondary overflow-hidden"
            style={vtImageName ? { viewTransitionName: vtImageName } : undefined}
            data-vt-target={vtTargetValue}
          >
            <Skeleton
              width="100%"
              height="100%"
              rounded={0}
              className="!rounded-none"
            />
          </div>
          {/* Back button placeholder */}
          <div className="absolute top-3 left-3">
            <Skeleton width={40} height={40} rounded="9999px" />
          </div>
        </div>

        {/* Info */}
        <div className="px-5 pt-4 flex flex-col gap-2">
          <Skeleton width="70%" height={28} />
          <div className="flex items-center gap-2 mt-1">
            <Skeleton width={120} height={18} />
            <Skeleton width={80} height={14} />
          </div>
          <Skeleton width="85%" height={14} />
          <Skeleton width={150} height={14} />
        </div>

        {/* Menu header */}
        <div className="px-5 mt-5">
          <Skeleton width={80} height={22} />
        </div>

        {/* Tabs placeholder */}
        <div className="px-5 mt-3">
          <div className="flex gap-2 overflow-hidden">
            <Skeleton width={80} height={36} rounded="9999px" />
            <Skeleton width={96} height={36} rounded="9999px" />
            <Skeleton width={72} height={36} rounded="9999px" />
            <Skeleton width={88} height={36} rounded="9999px" />
          </div>
        </div>

        {/* 4 menu items */}
        <div className="px-5 mt-4 flex flex-col gap-2 pb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface-primary p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <Skeleton width="65%" height={16} />
                <Skeleton width="90%" height={12} />
                <Skeleton width="70%" height={12} />
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Skeleton width={56} height={18} />
                <Skeleton width={32} height={32} rounded="9999px" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex md:flex-col">
        {/* Back button row */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-border-light bg-surface-primary">
          <Skeleton width={96} height={40} rounded="9999px" />
          <Skeleton width={40} height={40} rounded="9999px" />
        </div>

        {/* Hero 220px — desktop повторяет реальную высоту.
            VT landing target: парный элемент к обложкам карточек ресторана
            из DesktopPopularRestaurantsGrid и DesktopSearchResults. Имя
            формируется per-URL-id (numeric или slug). Если имя не совпадёт
            с тем, что проставлено на карточке-источнике, VT API молча
            деградирует в root cross-fade. */}
        <div
          className="relative h-[220px] w-full overflow-hidden bg-surface-secondary"
          style={vtImageName ? { viewTransitionName: vtImageName } : undefined}
          data-vt-target={vtTargetValue}
        >
          <Skeleton
            width="100%"
            height="100%"
            rounded={0}
            className="absolute inset-0 !rounded-none"
          />
          {/* Title placeholder (bottom-left, как в реальном hero) */}
          <div className="absolute left-8 bottom-8 flex flex-col gap-2">
            <Skeleton width={280} height={32} />
            <Skeleton width={140} height={16} />
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-6 bg-surface-primary px-8 py-5 border-b border-border-light">
          <Skeleton width={72} height={32} rounded="9999px" />
          <Skeleton width={220} height={14} />
          <Skeleton width={140} height={14} />
          <Skeleton width={160} height={14} />
        </div>

        {/* Two columns */}
        <div className="flex gap-8 px-8 py-6">
          {/* Left: menu */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <Skeleton width={80} height={24} />
            {/* Tabs */}
            <div className="flex gap-2">
              <Skeleton width={80} height={36} rounded="9999px" />
              <Skeleton width={96} height={36} rounded="9999px" />
              <Skeleton width={72} height={36} rounded="9999px" />
              <Skeleton width={88} height={36} rounded="9999px" />
            </div>
            {/* 4 menu items */}
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-surface-primary p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <Skeleton width="45%" height={16} />
                    <Skeleton width="70%" height={12} />
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Skeleton width={56} height={18} />
                    <Skeleton width={32} height={32} rounded="9999px" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: map + reviews */}
          <aside className="w-[420px] shrink-0 flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <Skeleton width={160} height={20} />
              <Skeleton height={200} rounded={16} />
              <Skeleton width="80%" height={14} />
            </section>

            <section className="flex flex-col gap-3">
              <Skeleton width={80} height={20} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-2xl bg-surface-secondary p-4"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton width={32} height={32} rounded="9999px" />
                    <Skeleton width={120} height={14} />
                    <div className="ml-auto">
                      <Skeleton width={72} height={14} />
                    </div>
                  </div>
                  <Skeleton width="92%" height={12} />
                  <Skeleton width="80%" height={12} />
                </div>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
