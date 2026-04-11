# src/components/mobile/BottomTabBar.tsx

Fixed-bottom мобильная навигация. 6 табов: Поиск, Бизнес-ланч, Карта, Избранное, Рейтинг (Trophy → /leaderboard), Профиль. Активный таб получает pill-фон с accent-tint через viewTransitionName: bottom-tab-indicator. Экспортирует: BottomTabBar компонент, DEFAULT_TABS массив, BottomTabItem и BottomTabBarProps интерфейсы. Поддерживает safe-area-inset-bottom, haptics через useHaptics(), View Transitions API morph. Используется в (site)/layout.tsx.
