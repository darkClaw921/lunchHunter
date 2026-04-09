# src/app/(site)/search/_components/MobileSearchResults.tsx

Мобильный список результатов поиска с миниатюрой карты справа в каждой карточке и модальным окном с интерактивной картой. Client component (use client).

# Компоненты

- MobileSearchResults({ query, results }): React.JSX.Element — экспортный client-компонент. State: selected (SearchResultItem | null) для модалки карты.
- MobileSearchResultCard — внутренний компонент карточки с refs (cardRef, linkRef) для shared-element morph.
- MapThumbnail({ lat, lng, onOpen }) — приватный лёгкий превью карты без maplibre-gl инстанса (только OSM raster tiles).

# Карточка (структура)

Внешний div (relative overflow-hidden rounded-xl border bg-surface-primary min-h-[140px]) содержит:
- MapThumbnail — absolute top-0 right-0 bottom-0 (ширина 340px), клик открывает модалку.
- <Link> (next/link) — absolute inset-y-0 left-0 right-[110px] z-10 — navigates to /restaurant/[id]?q=. На этом Link повешен ref linkRef и onClick handler.

Внутри Link: restaurantName 12/500 muted, itemName 15/600 line-clamp-1, rating + distance pill, цена accent 20/700.

# Shared-element morph стратегия (Phase 3)

- cardRef на внешнем div, viewTransitionName = restaurant-image-${restaurantId} в inline style (per-id naming).
- onClick на Link: если supportsViewTransitions() → return (браузер сам сделает VT через @view-transition navigation:auto); иначе preventDefault + navigate(router, href, { sourceEl: cardRef.current, targetSelector: [data-vt-target="restaurant-image-${restaurantId}"] }).
- Prefetch обложки: usePrefetchImage() вызывается на onPointerEnter/onPointerDown — hi-res картинка оказывается в кеше к моменту морфа.

# MapThumbnail

- Вычисляет Web Mercator world-pixels на zoom 15, набор OSM тайлов.
- Рендерит как Next Image с width/height (layout-shift safe).
- Маркер в 78% ширины.
- Декоративные слои: backdrop-filter blur + белый gradient overlay.
- onClick: preventDefault + stopPropagation + onOpen().

# Модалка карты

Открывается через setSelected(r). Fixed inset-0 bg-black/50. Bottom-sheet 70dvh с header (restaurant name + address + close X) и MapView. Закрытие: клик по backdrop, X, Escape (useEffect). Блокирует прокрутку фона.

# Зависимости

- react (useRef, useState, useEffect, useCallback)
- next/link (Link)
- next/navigation (useRouter)
- lucide-react (Star, X)
- @/components/map/MapView
- @/lib/transitions (navigate, supportsViewTransitions)
- @/lib/hooks/usePrefetchImage (usePrefetchImage)
- @/lib/utils/format
- @/app/api/search/route (тип SearchResultItem)

# Используется в

- src/app/(site)/search/page.tsx — мобильная ветка (md:hidden)
