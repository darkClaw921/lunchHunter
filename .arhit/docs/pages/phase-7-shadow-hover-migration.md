# Phase 7: transition-shadow → .shadow-hover migration

Заменён анти-паттерн 'animate box-shadow' (см. ANIMATIONS_GUIDE.md §13) на utility .shadow-hover, который анимирует opacity на ::after псевдоэлементе.

## Что такое .shadow-hover

Определён в src/app/globals.css (Phase 1):

    .shadow-hover { position: relative; }
    .shadow-hover::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: 0 8px 24px -8px rgba(0,0,0,0.15);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dur-fast) var(--ease-out-quart);
    }
    .shadow-hover:hover::after { opacity: 1; }

Браузер перерисовывает только зону ::after (opacity-change), а не всю карточку — это GPU-friendly и не триггерит layout/paint на всех children.

## Мигрированные компоненты

- src/components/ui/Card.tsx (при interactive=true)
- src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx
- src/app/(site)/search/_components/DesktopSearchResults.tsx (SearchResultCard)
- src/app/(site)/search/_components/MobileSearchResults.tsx (MobileSearchResultCard — обёрнут во внешний div, cardRef и viewTransitionName сохранены на внутреннем)
- src/app/(site)/business-lunch/_components/DesktopBusinessLunch.tsx
- src/app/(site)/business-lunch/page.tsx (мобильный Link)
- src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx (Desktop + Mobile)
- src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx (Desktop + Mobile)
- src/app/(site)/map/_components/MobileMapView.tsx

## Тонкости миграции

1. **overflow-hidden + shadow-hover** несовместимы: ::after рендерится внутри родителя и его box-shadow обрезается overflow-hidden. Решение — перенести overflow-hidden с внешнего Link на внутренний div обложки, добавив rounded-t-2xl/rounded-l-lg чтобы картинка не вылезала за скругления.

2. **position: absolute дети** конфликтуют с shadow-hover только если они прямые child-ы на Link-elemente и используют его как containing block. В MobileSearchResults абсолютные дети (Link, MapThumbnail) находятся внутри карточки, поэтому shadow-hover применён к внешней обёртке — cardRef + viewTransitionName остались на внутреннем div.

3. **FLIP fallback и View Transitions** не затронуты: ::after — декоративный псевдоэлемент без viewTransitionName, он не включается в VT snapshot.

4. **postоянная тень (shadow-sm) + shadow-hover** работают вместе: shadow-sm даёт базовый box-shadow, shadow-hover добавляет overlay при hover через ::after.