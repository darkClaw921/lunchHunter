# src/app/(site)/_components/NearbyRestaurantsRow.tsx

Client-компонент горизонтального скролл-списка карточек ресторанов 'Рядом с вами' для мобильной главной (src/app/(site)/page.tsx).

## Назначение

Изолирует клиентскую логику shared-element morph в отдельный компонент, чтобы page.tsx (Server Component) оставался серверным и не требовал 'use client' на всю страницу.

## Интерфейс

### NearbyRestaurantsRowItem
Тип одной карточки: id (number), slug (string), name (string), category (string), rating (number | null), distanceMeters (number | null), priceAvg (number | null), coverUrl (string | null).

### NearbyRestaurantsRowProps
{ items: NearbyRestaurantsRowItem[] }

### NearbyRestaurantsRow({ items }): JSX.Element
Экспортный React-компонент. Внутри хранит useState<number | null>(null) — activeId (ID карточки, на которой произошёл pointerdown).

## Механика shared-element morph

Перед навигацией на /restaurant/[slug] пользователь жмёт на карточку:
1. onPointerDown(() => setActiveId(r.id)) обновляет state.
2. На следующем render ровно одна карточка получает data-vt-active='restaurant' через spread: {...(isActive && { 'data-vt-active': 'restaurant' })}
3. CSS-правило в globals.css: [data-vt-active='restaurant'] { view-transition-name: restaurant-hero; } применяет VT-name.
4. TransitionLink перехватывает click, вызывает document.startViewTransition — браузер делает снимок с помеченной карточкой.
5. На странице /restaurant/[id] hero-элемент тоже имеет view-transition-name: restaurant-hero.
6. Браузер морфит карточку в hero.

Критично: в списке должна быть только ОДНА активная карточка в DOM в момент снимка — иначе VT API откажется (коллизия имён).

## Зависимости

- react (useState)
- @/components/ui/Card — визуальная обёртка карточки (noPadding, interactive)
- @/components/ui/TransitionLink — замена next/link с хаптиком + VT API
- @/lib/utils/format — formatPrice, formatDistance, formatRating

## Используется в

- src/app/(site)/page.tsx — мобильная секция 'Рядом с вами' (md:hidden)
