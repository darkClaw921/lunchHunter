# RestaurantIndexCards

Клиентский файл с компонентами для карточек страницы списка ресторанов /restaurant.

Расположение: src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx
use client directive

Вынесен в отдельный файл, чтобы restaurant/page.tsx оставалась серверным компонентом (читает данные через getNearbyRestaurants), а карточки могли использовать client-only хук usePrefetchImage для предзагрузки hi-res hero-картинки на onPointerEnter/onPointerDown (long-press prefetch, ANIMATIONS_GUIDE §9).

Экспортируемые компоненты:
1. RestaurantIndexCardDesktop({r}: {r: RestaurantIndexItem}) — 16:10 hero + title + rating + category badge + address. Hover: group-hover scale transform. Использует usePrefetchImage + onPointerEnter/onPointerDown для prefetch r.coverUrl.

2. RestaurantIndexCardMobile({r}: {r: RestaurantIndexItem}) — 96×96 thumb слева + title / rating / category / address в правой колонке. Внутри Card wrapper. Те же prefetch-обработчики.

Тип:
- RestaurantIndexItem: {id, slug, name, category, address, rating, coverUrl}
