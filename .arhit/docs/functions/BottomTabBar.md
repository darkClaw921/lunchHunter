# BottomTabBar

Компонент мобильной навигации с 5 табами (Поиск, Бизнес-ланч, Карта, Избранное, Профиль).

**Основная функциональность:**
- Фиксированная позиция внизу экрана с поддержкой safe-area-inset-bottom
- Активный таб подсвечивается pill-фоном с accent-цветом
- Навигация через Link из next/link с View Transitions API для морфинга индикатора
- Хаптик-обратная связь через useHaptics hook

**Анимация при переходе между табами:**
- При смене активного таба индикатор морфируется через промежуточные позиции
- На каждую промежуточную позицию срабатывает haptics.selection() (50мс между шагами)
- Синхронизировано с View Transitions API морфингом pill-индикатора
- viewTransitionName: 'bottom-tab-indicator' вешается только на активный таб

**Props:**
- items: массив BottomTabItem (href, label, icon, matchPrefixes)
- className: дополнительные CSS классы

**Использование:**
- Вставляется в (site)/layout.tsx для мобильной версии
- Автоматически отслеживает pathname через usePathname()
- Поддерживает customizable tabs через DEFAULT_TABS
