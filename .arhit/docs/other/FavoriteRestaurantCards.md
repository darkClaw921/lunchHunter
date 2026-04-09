# FavoriteRestaurantCards

Клиентский файл с компонентами для карточек избранного (favorites/page.tsx).

Расположение: src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx
use client directive

Вынесен в отдельный файл, чтобы favorites/page.tsx оставалась серверным компонентом (читает сессию и тянет данные через getUserFavorites), а карточки могли использовать client-only хук usePrefetchImage для предзагрузки hi-res hero-картинки на onPointerEnter/onPointerDown (long-press prefetch, ANIMATIONS_GUIDE §9).

Экспортируемые компоненты:
1. FavoriteRestaurantCardDesktop({r}: {r: FavoriteRestaurant}) — 16:10 hero + title + rating + category badge + address. Hover: group-hover scale transform. Использует usePrefetchImage + onPointerEnter/onPointerDown для prefetch r.coverUrl.

2. FavoriteRestaurantCardMobile({r}: {r: FavoriteRestaurant}) — 96×96 thumb слева + title / rating / category / address в правой колонке. Внутри Card wrapper. Те же prefetch-обработчики.

3. PrefetchRestaurantLink — универсальный Link wrapper, который догружает hi-res обложку ресторана на hover/pointerdown. Принимает href, restaurantCoverUrl, className, children. Используется для secondary секций (Блюда, Бизнес-ланчи) в favorites, где thumbnail — не hero, но навигация идёт на страницу с этим cover как hero.

Типы:
- FavoriteRestaurant: {id, slug, name, category, address, rating, coverUrl}
- PrefetchRestaurantLinkProps: {href, restaurantCoverUrl, className, children}
