# src/app/(site)/search/_components/MobileSearchResults.tsx

Мобильный список результатов поиска с миниатюрой карты в правой части каждой карточки и модальным окном с интерактивной картой.

# Компоненты
- MobileSearchResults({ query, results }) — экспортный client-компонент (use client), содержит состояние selected (SearchResultItem | null). Рендерит колонку карточек и модалку.
- MapThumbnail({ lat, lng, onOpen }) — приватный, лёгкий превью карты без maplibre-gl инстанса.

# Карточка
- Обёртка: relative overflow-hidden rounded-xl bg-surface-primary.
- Справа absolute кнопка MapThumbnail (170px ширина), слева Link с pr-[150px] на /restaurant/[slug]?q=.
- Инфо: название ресторана / название блюда / рейтинг + distance pill / цена (accent).

# MapThumbnail
- Вычисляет Web Mercator world-pixels на zoom 15 и набор OSM raster-тайлов tileX0..tileX1 × tileY0..tileY1, покрывающих видимую область W×H (170×full-height).
- Рендерит их как <img loading=lazy> из https://tile.openstreetmap.org/{z}/{x}/{y}.png с absolute left/top.
- По центру оранжевый accent-маркер (16px, 3px white border, box-shadow).
- Бесшовный переход в левую часть карточки через два декоративных слоя (pointer-events-none):
  1. backdrop-filter: blur(6px) с линейной mask-image от чёрного (30%) к прозрачному (100%)
  2. белый linear-gradient от --color-surface-primary к прозрачному
- onClick: e.preventDefault() + stopPropagation() чтобы не триггерить внешний Link, и onOpen().

# Модалка
- Открывается когда selected != null. Fixed inset-0 z-50 bg-black/50 backdrop-blur-sm.
- Внутри: rounded-2xl контейнер 60vh max-h-520px, MapView (MapLibre+OSM) с одним маркером, center={lat,lng}, zoom 15.
- Pill с названием ресторана и блюда внизу слева (pointer-events-none).
- Закрытие: клик по backdrop (onClick={close}), кнопка X в правом верхнем углу, Escape (useEffect listener на document keydown).
- useEffect также блокирует прокрутку фона через document.body.style.overflow='hidden' пока открыта.

# Зависимости
- next/link, lucide-react (Star, X), react
- @/components/map/MapView — интерактивная MapLibre карта в модалке
- @/lib/utils/format — formatPrice, formatDistance, formatRating
- @/app/api/search/route — тип SearchResultItem

# Использование
Вызывается из src/app/(site)/search/page.tsx в мобильной ветке рендера (md:hidden) вместо inline-списка карточек.
