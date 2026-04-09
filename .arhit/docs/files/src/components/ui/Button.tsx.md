# src/components/ui/Button.tsx

Button primitive — базовая кнопка приложения со стилями по pencil lanchHunter.pen. Client component ("use client"), использует CVA для вариантов.

**Варианты (variant):**
- primary — заливка accent #FF5C00, белый текст (основная CTA)
- secondary — мягкая заливка surface-secondary с тёмным текстом
- ghost — без фона, accent hover
- accent-soft — фон accent-light #FFF0E6 с accent-текстом (chips-like CTA)
- danger — красная заливка

**Размеры (size):** sm (h-9) / md (h-11, default) / lg (h-14)
**fullWidth:** boolean — растягивает кнопку на 100% ширины

**Пропы (ButtonProps):**
- variant, size, fullWidth — CVA variants
- leftIcon, rightIcon — lucide-иконки вокруг текста
- type (default "button") + все стандартные React.ButtonHTMLAttributes

**Press feedback (Фаза 4):**
- active:scale-[0.97] transition-transform duration-100 — микро-анимация при нажатии (100мс)
- useHaptics().tap() вызывается ДО пользовательского onClick в обёрнутом handleClick (мгновенный отклик даже если коллбек асинхронный)
- disabled:pointer-events-none гарантирует, что у disabled-кнопок хаптик не срабатывает

**Экспорты:** Button (React.forwardRef), buttonVariants (для переиспользования cn классов)
**Зависимости:** class-variance-authority, @/lib/utils/cn, @/lib/hooks/useHaptics
