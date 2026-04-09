# src/app/(site)/restaurant/[id]/page.tsx

Страница детали ресторана — /restaurant/[id] или /restaurant/[slug]. Server Component, dynamic='force-dynamic'.

## Параметры

- params: { id: string } — числовой ID или URL-slug
- searchParams: { q?: string } — поисковый highlight query

## Данные

1. Определяет isNumeric (/^\d+$/) → lookup по restaurants.id или restaurants.slug
2. Parallel query (Promise.all):
   - menuCategories WHERE restaurantId, ORDER sortOrder
   - menuItems WHERE restaurantId, ORDER id
   - restaurantPhotos { url } WHERE restaurantId, ORDER sortOrder
3. haversineDistance(DEFAULT_LAT/LNG, restaurant.lat, restaurant.lng) — до Москвы-центра
4. Fav состояние: validateSession, isFavorited (для ресторана), getFavoritedIds (для menu items)

## Структура

Рендерит ДВА варианта в одном JSX:
- <DesktopRestaurantDetail className='hidden md:flex' /> — полноэкранный десктопный layout
- <div className='flex flex-col md:hidden'> — мобильный блок

## Мобильный блок

1. Hero (relative h-[220px]): cover image с style={{ viewTransitionName: 'restaurant-hero' }} — landing target для shared-element morph из карточки ресторана. BackButton icon variant.
2. Info (px-5 pt-4): title 24/700, 5 звёзд + rating + (128 отзывов), MapPin + address + RestaurantMapModal, distance accent.
3. Menu: RestaurantMenu с categories, highlightQuery, favoritedMenuItemIds, isAuthenticated.
4. FavoriteButton button variant для ресторана.

## Parse hoursJson

Helper внутри функции: парсит JSON, берёт первый непустой day → string 'HH:MM' или tuple [from, to] → 'HH:MM — HH:MM'. Fallback '—'.

## Shared-element morph (Фаза 5)

Hero-блок имеет view-transition-name: restaurant-hero — landing target. На стороне списков (NearbyRestaurantsRow, MobileSearchResults, DesktopSearchResults, MobileMapView, DesktopPopularRestaurantsGrid) тот же VT-name ставится на нажатую карточку через data-vt-active атрибут. Браузер морфит карточку в hero.

Mobile и desktop версии одновременно не конфликтуют: md:hidden / hidden md:flex используют display: none, а display:none элементы НЕ участвуют в снимке VT API.

## Экспорты

- default: RestaurantDetailPage (async function)
- formatMenuPrice(price): string — reexport formatPrice (используется RestaurantMenu)

## Зависимости

- next/navigation (notFound), lucide-react (MapPin, Star)
- drizzle-orm (eq, asc), @/lib/db/client, @/lib/db/schema
- @/lib/geo/haversine, @/lib/utils/format
- @/lib/auth/session, @/lib/db/favorites
- ./_components/{BackButton, RestaurantMenu, DesktopRestaurantDetail, RestaurantMapModal}
- @/components/ui/FavoriteButton
