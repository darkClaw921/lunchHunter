# src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx

Server Component — десктопный layout страницы ресторана.

## Интерфейс

DesktopRestaurantDetailProps: restaurantId, name, category, address, phone, hours, rating, heroUrl, categories (MenuCategory[]), highlightQuery, lat, lng, restaurantFavorited, favoritedMenuItemIds (number[]), isAuthenticated, className.

## Структура (pixel-perfect по pencil frame Yi1h9)

1. Back button row (px-8 py-3 border-b): BackButton pill variant + FavoriteButton icon variant.
2. Hero-баннер (relative h-[220px] overflow-hidden): img cover или category placeholder, dark gradient overlay to-black/60, title (28/700 white) + category (14/400 white/75) absolute left-8 bottom-8.
3. Info row (px-8 py-5): accent Star + rating pill, MapPin + address, Clock3 + hours, (Phone + phone if not null).
4. Two columns (px-8 py-6 gap-8):
   - Left (flex-1): h2 'Меню' 20/700 + RestaurantMenu с categories, highlightQuery, favoritedMenuItemIds, isAuthenticated.
   - Right (w-[420px] shrink-0):
     - section 'Местоположение' — h3 16/600, MapView 200px (zoom 15, single marker), address 13/400.
     - section 'Отзывы' — h3 + 3 DEMO_REVIEWS (surface-secondary 2xl cards с аватаром accent + name + rating + text).

## Shared-element morph (Фаза 5)

Hero-баннер имеет style={{ viewTransitionName: 'restaurant-hero' }} — landing target для morph из карточек DesktopPopularRestaurantsGrid и DesktopSearchResults. Mobile-hero в page.tsx в момент десктопа скрыта через md:hidden (display: none), не конфликтует.

## DEMO_REVIEWS

Захардкоженные 3 демонстрационных отзыва (Анна К., Дмитрий М., Елена В.). Временная заглушка.

## Зависимости

- lucide-react (MapPin, Clock3, Phone, Star)
- ./RestaurantMenu, ./BackButton
- @/lib/utils/format (formatRating), @/lib/utils/cn
- @/components/map/MapView
- @/components/ui/FavoriteButton

## Используется в

- src/app/(site)/restaurant/[id]/page.tsx — десктопная ветка (className='hidden md:flex')
