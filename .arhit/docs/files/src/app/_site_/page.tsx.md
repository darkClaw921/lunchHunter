# src/app/(site)/page.tsx

Корневая страница сайта — главная (/). Server Component, dynamic='force-dynamic'.

## Структура

Рендерит два варианта в одном JSX через responsive-классы:
- <DesktopHome className='hidden md:flex' /> — hero с HeroFloatingCards, 3 FeatureCard, 'Популярные рестораны' (DesktopPopularRestaurantsGrid)
- Мобильный блок <div className='flex flex-col md:hidden'> — header, SearchHomeForm, категории Chip, популярные запросы, business-lunch баннер, секция 'Рядом с вами' (NearbyRestaurantsRow), PWAInstallBanner

## Данные (Promise.all)

- getNearbyRestaurants({ userLat, userLng, limit: 8 }) — ближайшие рестораны по DEFAULT_LAT/LNG (Москва)
- getPopularQueries(6) — популярные поисковые запросы
- getFeaturedBusinessLunches(3) — топ бизнес-ланчи
- getFeaturedMenuItems(4) — топ блюда
- getMinBusinessLunchPrice() — минимальная цена бизнес-ланча (для баннера)

## Shared-element morph (Фаза 5)

Секция 'Рядом с вами' (мобильный) и 'Популярные рестораны' (десктоп) используют client-компоненты (NearbyRestaurantsRow, DesktopPopularRestaurantsGrid), которые дёргают onPointerDown на карточке и ставят data-vt-active='restaurant' на нажатую — это включает CSS view-transition-name: restaurant-hero и делает morph в hero страницы ресторана.

## Константы

- DEFAULT_LAT/LNG = 55.7558/37.6173 (Москва, Красная площадь)
- CATEGORIES = [бары, кафе, рестораны, фастфуд]

## Зависимости

- next/link (Link в header, популярных запросах, business-lunch баннере — эти ссылки пока не обёрнуты в TransitionLink)
- lucide-react (Bell, Search)
- @/components/ui/{Chip, Badge}
- @/app/(site)/_components/{SearchHomeForm, DesktopHome, NearbyRestaurantsRow}
- @/components/mobile/PWAInstallBanner
- @/lib/db/queries
- @/lib/utils/format (formatPrice)
