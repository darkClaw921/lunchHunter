# src/lib/hooks/usePrefetchImage.ts

Client-only хук ("use client") для предзагрузки hi-res картинки в browser image cache (long-press prefetch, ANIMATIONS_GUIDE §9).

# Экспорты
- usePrefetchImage(): (url: string | null | undefined) => void

Возвращает стабильный (useCallback([])) prefetch callback, который создаёт new window.Image() и присваивает img.src = url — браузер обрабатывает это как обычный image request и кладёт байты в HTTP/Image cache. Так последующий <img src={sameUrl}> на destination-странице читает ответ без network round-trip.

# SSR-safe
На сервере (typeof window === undefined) возвращает noop. Null/undefined URL игнорируется — удобно когда coverUrl опциональное поле модели ресторана.

# Зачем
Используется на карточках ресторанов в списочных компонентах в связке с onPointerEnter (desktop hover) и onPointerDown (mobile touch start), чтобы к моменту морфа через View Transitions API hi-res обложка уже была закеширована — убирает flash of loading в shared-element transition.

# Файл
src/lib/hooks/usePrefetchImage.ts

# Консьюмеры
- NearbyRestaurantsRow
- DesktopPopularRestaurantsGrid
- DesktopSearchResults
- MobileSearchResults
- MobileMapView
- FavoriteRestaurantCards
- RestaurantIndexCards
