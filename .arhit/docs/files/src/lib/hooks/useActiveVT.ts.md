# src/lib/hooks/useActiveVT.ts

Хук для управления "активной" карточкой в списке — той, на которую кликнули и которой нужно выставить view-transition-name.

## Зачем нужен

По ANIMATIONS_GUIDE §9.5.3 view-transition-name должен быть уникальным в момент snapshot'а. Если постоянно держать имя на всех карточках списка, при soft-навигации Next.js в DOM на короткий момент могут жить одновременно и старая карточка-источник, и hero на новом экране с одним именем — Chrome/Safari бросают InvalidStateError.

Решение: держать имя только на активной карточке (той, по которой кликнули).

## API

### useActiveVT<TId>(storageKey)

Возвращает { activeId, activate, isActive }:
- activeId: TId | null — текущий активный id или null
- activate(id): synchronously через flushSync проставляет activeId (чтобы React закоммитил до VT snapshot'а)
- isActive(id): shortcut для сравнения activeId === id

При монтировании useEffect читает sessionStorage[storageKey] и сразу очищает его — это нужно для back-навигации, когда detail-страница перед router.back() кладёт id в storage через rememberActiveForBack.

### rememberActiveForBack(storageKey, id)

Записывает id в sessionStorage перед back-навигацией. SSR-safe.

### ACTIVE_RESTAURANT_VT_STORAGE_KEY

Константа 'lh:vt-active-restaurant' — стандартный ключ для VT активной карточки ресторана.

## Где используется

- src/app/(site)/_components/NearbyRestaurantsRow.tsx
- src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx
- src/app/(site)/search/_components/MobileSearchResults.tsx
- src/app/(site)/search/_components/DesktopSearchResults.tsx
- src/app/(site)/map/_components/MobileMapView.tsx
- src/app/(site)/restaurant/[id]/_components/BackButton.tsx (rememberActiveForBack)

## Зависимости

- react (useCallback, useEffect, useState)
- react-dom (flushSync)
