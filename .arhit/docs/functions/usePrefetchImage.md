# usePrefetchImage

Client-side hook для предзагрузки hi-res картинки в browser image cache.

Расположение: src/lib/hooks/usePrefetchImage.ts

Экспортирует функцию usePrefetchImage(): (url: string | null | undefined) => void. Возвращаемый callback создаёт new window.Image() и присваивает img.src = url. Браузер обрабатывает эту загрузку как обычный image request и кладёт байты в HTTP/Image cache.

Паттерн: long-press prefetch из ANIMATIONS_GUIDE §9. Используется на карточках ресторанов в паре с onPointerEnter (desktop hover) и onPointerDown (mobile touch start), чтобы к моменту перехода на страницу детали hi-res hero-картинка уже была в браузерном кеше. Это устраняет flash of loading при View Transitions API shared-element morph.

SSR-safe: на сервере (typeof window === undefined) возвращает noop. Null/undefined url игнорируется.

Импортирован в 7 клиентских компонентах:
- src/app/(site)/_components/NearbyRestaurantsRow.tsx
- src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx  
- src/app/(site)/search/_components/DesktopSearchResults.tsx
- src/app/(site)/search/_components/MobileSearchResults.tsx
- src/app/(site)/map/_components/MobileMapView.tsx
- src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx
- src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx

Реализация:
export function usePrefetchImage(): (url: string | null | undefined) => void {
  return useCallback((url) => {
    if (!url || typeof window === 'undefined') return;
    const img = new window.Image();
    img.src = url;
  }, []);
}
