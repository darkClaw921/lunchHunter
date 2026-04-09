# src/app/(site)/_components/DesktopHome.tsx

Server Component с десктопным вариантом главной — hero с HeroFloatingCards, 3 FeatureCard, секция 'Популярные рестораны' через DesktopPopularRestaurantsGrid.

## Интерфейс

DesktopHomeProps: popularRestaurants (DesktopHomeRestaurant[]), heroMenuItems (DesktopHomeHeroMenuItem[]), heroLunches (DesktopHomeHeroLunch[]), className

DesktopHomeRestaurant: { id, slug, name, category, rating, distanceMeters, priceAvg, coverUrl }
DesktopHomeHeroMenuItem: { id, name, price, photoUrl, restaurantName }
DesktopHomeHeroLunch: { id, name, price, restaurantName, timeFrom, timeTo }

## Структура (1440px base)

1. Hero (surface-secondary gradient, pb-32, -mb-16): HeroFloatingCards фоном, радиальный overlay для читаемости, h1 48/700, подзаголовок 18, SearchHomeForm 640px.
2. Features: 3 FeatureCard (Coins, MapPin, Star) с заголовками 'Самое дешёвое / Ближе всего / Лучший рейтинг'.
3. Popular restaurants: DesktopPopularRestaurantsGrid (client-компонент, 4 карточки в ряд с TransitionLink + shared-element morph).

## Зависимости

- lucide-react (Coins, MapPin, Star)
- @/components/desktop/FeatureCard
- ./SearchHomeForm, ./HeroFloatingCards, ./DesktopPopularRestaurantsGrid
- @/lib/utils/cn

## Используется в

- src/app/(site)/page.tsx — единственная точка вызова, рендерится при className='hidden md:flex'
