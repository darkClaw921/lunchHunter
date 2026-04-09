# src/app/(site)/map/_components/MobileMapView.tsx

Мобильный /map page client wrapper — full-bleed MapLibre карта + RadiusSelector сверху + bottom-sheet с 2 ближайшими результатами. Client component ('use client').

## Интерфейс

MobileMapItem: { id, restaurantName, restaurantSlug, itemName, price, distanceMeters, lat, lng }
MobileMapViewProps: query (string), radius (number), centerLat, centerLng, items (MobileMapItem[])

## State

- isPending (useTransition) — индикатор обновления после изменения радиуса
- activeVtId (number | null) — ID bottom-sheet карточки, на которой произошёл pointerdown (shared-element morph)

## Поведение

1. handleRadiusChange(next): router.push(/map?q=...&radius=next) внутри startTransition — сервер пересчитывает геозапрос и возвращает новые items.
2. Markers для MapView: items → MapMarker с href=/restaurant/[slug]?q=
3. top2 = items.slice(0, 2) — две ближайшие для bottom sheet

## Bottom sheet

2 карточки в rounded-xl border:
- TransitionLink (замена next/link) — навигация на /restaurant/[slug]
- onPointerDown={() => setActiveVtId(item.id)} — ставит data-vt-active='restaurant' на активную карточку
- Внутри: name (14/600), itemName + price (12/400 muted), справа accent-light pill с distance

Пустое состояние: rounded-xl border с текстом 'В этом радиусе ничего не найдено'.

## Зависимости

- next/navigation (useRouter), react (useState, useTransition)
- @/components/map/{MapView, RadiusSelector}
- @/components/ui/TransitionLink (Фаза 5)
- @/lib/utils/format

## Используется в

- src/app/(site)/map/page.tsx — мобильная ветка (md:hidden)
