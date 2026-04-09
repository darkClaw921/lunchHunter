# src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx

Client-компонент сетки 4 карточек 'Популярные рестораны' в десктопном варианте главной (src/app/(site)/_components/DesktopHome.tsx).

## Назначение

Десктопный двойник NearbyRestaurantsRow — тоже отделён от server-компонента DesktopHome, чтобы изолировать 'use client' + useState в подкомпонент вместо эскалации на всю DesktopHome.

## Интерфейс

### DesktopPopularRestaurantsGridItem
{ id, slug, name, category, rating, distanceMeters, priceAvg, coverUrl } — структурно совпадает с NearbyRestaurantsRowItem.

### DesktopPopularRestaurantsGridProps
{ items: DesktopPopularRestaurantsGridItem[] }

### DesktopPopularRestaurantsGrid({ items }): JSX.Element
Экспортный React-компонент. Хранит useState<number | null> activeId. Отображает grid grid-cols-4 gap-5 (slice(0, 4) — максимум 4 карточки).

## Визуал

Каждая карточка:
- rounded-2xl border border-border-light bg-surface-primary shadow-sm
- h-40 cover (object-cover + group-hover:scale-[1.02])
- p-4 flex-col gap-2: title, Star+rating+category, distance (accent)
- hover:shadow-md

## Shared-element morph

Аналогично NearbyRestaurantsRow:
- onPointerDown=() => setActiveId(r.id)
- data-vt-active='restaurant' применяется к TransitionLink spread-атрибутом только на активную карточку
- CSS-правило [data-vt-active='restaurant'] { view-transition-name: restaurant-hero } в globals.css
- На странице /restaurant/[id] парный hero с тем же VT-name

## Зависимости

- react (useState)
- lucide-react (Star)
- @/components/ui/TransitionLink
- @/lib/utils/format — formatDistance, formatRating

## Используется в

- src/app/(site)/_components/DesktopHome.tsx — секция 'Популярные рестораны' (hidden md:flex)
