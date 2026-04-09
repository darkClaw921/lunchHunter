# src/app/(site)/search/_components/DesktopSearchResults.tsx

Десктопный split-view: слева 55% (до 790px) — sort-чипы + список результатов, справа (flex-1) — MapLibre карта с маркерами и RadiusSelector. Client component.

## Интерфейс

DesktopSearchResultsProps: query, sort (DesktopSort = 'cheapest' | 'nearest' | 'rating'), results (SearchResultItem[]), className

## State

- radius: number = 5000 — фильтр радиуса для маркеров/результатов
- activeMarkerId: number | null — ID карточки под mouse (для подсветки маркера на карте и ring-2 на карточке)
- activeVtId: number | null — ID карточки, на которой произошёл pointerdown (для shared-element morph)

## Компоненты внутри

- SortChip({ label, active, href }) — приватный, обычный next/link pill (чипы фильтров, не навигация на страницу ресторана).

## Карточка результата

TransitionLink (rounded-2xl bg-surface-secondary p-4 hover:shadow-md, +ring-2 ring-accent если activeMarkerId === r.itemId, +data-vt-active если activeVtId === r.itemId):
- onMouseEnter/Leave → setActiveMarkerId (связь с картой)
- onPointerDown → setActiveVtId (shared-element morph)
- Левая: 72×72 rounded-xl bg-accent-light + UtensilsCrossed icon accent
- Правая: restaurantName / itemName / price accent + distance + rating Star

## Правая панель

- MapView (весь inset-0): markers из filteredResults, center Moscow, zoom 12, radiusMeters, onMarkerClick → setActiveMarkerId
- RadiusSelector — floating сверху слева (top-4 left-4) в rounded-2xl surface-primary shadow-md pill

## Зависимости

- next/link (для SortChip), react (useMemo, useState)
- lucide-react (UtensilsCrossed, Star)
- @/components/map/{MapView, RadiusSelector}
- @/components/ui/TransitionLink (Фаза 5)
- @/lib/utils/{format, cn}
- @/app/api/search/route (тип SearchResultItem)

## Используется в

- src/app/(site)/search/page.tsx — десктопная ветка (hidden md:flex)
