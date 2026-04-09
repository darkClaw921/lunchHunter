# src/components/map/RadiusSelector.tsx

RadiusSelector — pill-образный сегментированный селектор радиуса поиска. Client component ("use client").

**Назначение:**
Controlled-компонент для выбора радиуса поиска из набора опций (по умолчанию 500м / 1км / 3км / 5км). Встраивается над MapView (mobile) или плавает в верхнем-левом углу desktop split-view map panel.

**Стили:**
- Активный pill — bg-accent text-white
- Неактивный — bg-surface-primary border border-border (hover bg-surface-secondary)
- size="md" (mobile): h-9 px-4 text-sm
- size="sm" (desktop overlay): h-7 px-3 text-[12px]

**Экспорты:**
- RadiusSelector (default + named) — основной компонент
- DEFAULT_RADIUS_OPTIONS — readonly array опций
- RadiusOption interface: { meters: number; label: string }
- RadiusSelectorProps: value, onChange, options, className, size

**Press feedback + хаптики (Фаза 4):**
- active:scale-95 transition-transform duration-100 на каждом pill
- useHaptics().selection() вызывается в handleSelect при смене радиуса — НО ТОЛЬКО если meters !== value (не при тапе на уже активный pill, чтобы не спамить хаптиком)
- Аксессибилити: role="radiogroup" + role="radio" + aria-checked

**Зависимости:** @/lib/utils/cn, @/lib/hooks/useHaptics
