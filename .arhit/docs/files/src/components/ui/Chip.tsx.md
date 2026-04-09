# src/components/ui/Chip.tsx

Chip / Pill primitive — pill-образная кнопка для фильтров категорий и популярных запросов. Client component ("use client"), использует CVA для вариантов.

**Варианты (variant):**
- default — нейтральный outline (inactive filter): bg-surface-primary + border-border
- active — accent solid (selected): bg-accent text-white border-accent
- soft — accent-light фон + accent текст (chip популярных запросов)

**Размеры (size):** sm (h-8 px-3 text-xs) / md (h-10 px-4 text-sm, default)

**Пропы (ChipProps):**
- variant, size — CVA variants
- active — boolean, принудительно активирует вариант "active" (override variant)
- leftIcon — lucide-иконка слева
- type (default "button") + все стандартные React.ButtonHTMLAttributes

**Press feedback (Фаза 4):**
- active:scale-95 transition-transform duration-100 — заметнее чем у Button (chip сам меньше)
- useHaptics().selection() в handleClick ДО пользовательского onClick — тактильный отклик "изменение выбора", подходящий для фильтр-чипов
- data-active="true" атрибут для CSS-селекторов

**Экспорты:** Chip (React.forwardRef), chipVariants
**Зависимости:** class-variance-authority, @/lib/utils/cn, @/lib/hooks/useHaptics
