# src/components/mobile/BottomTabBar.tsx

BottomTabBar — fixed-bottom mobile навигация по pencil lanchHunter.pen. Client component ("use client").

**Структура:**
- 5 табов: Поиск (/), Бизнес-ланч (/business-lunch), Карта (/map), Избранное (/favorites), Профиль (/profile)
- Активный таб: bg-accent-light text-accent (pill-фон)
- Неактивный: text-fg-secondary hover:text-fg-primary
- Поддерживает safe-area-inset-bottom через env()

**Логика определения активного таба:**
- isTabActive(pathname, item) — проверяет matchPrefixes[] против pathname
- Для "/" (Поиск) — строгое равенство, иначе startsWith(prefix)

**Экспорты:**
- BottomTabBar (основной компонент)
- BottomTabBarProps { items?, className? }
- BottomTabItem { href, label, icon, matchPrefixes? }
- DEFAULT_TABS — readonly array по умолчанию из 5 табов

**Route transitions + haptics + VT (Фаза 4):**
1. **TransitionLink вместо Link** — каждый таб использует @/components/ui/TransitionLink. Это автоматически даёт: haptics.tap() → RouteProgress start → navigateWithViewTransition.
2. **haptics.selection()** в onClick (через handleTabClick) — дополнительный "переключение выбора" хаптик, корректнее для навигационных табов чем medium impact.
3. **active:scale-95 transition-transform duration-100** — press-эффект на каждом TransitionLink.
4. **viewTransitionName: 'bottom-tab-indicator'** — CRITICAL: вешается ТОЛЬКО на активный таб через inline style. Браузер делает morph скользящего pill-индикатора через View Transitions API. Имя должно быть УНИКАЛЬНЫМ на всё дерево, иначе VT API падает с ошибкой дублирования.

**Зависимости:**
- next/navigation (usePathname)
- lucide-react (Search, UtensilsCrossed, Map, Heart, User, LucideIcon)
- @/lib/utils/cn
- @/components/ui/TransitionLink (Фаза 2)
- @/lib/hooks/useHaptics (Фаза 1)
