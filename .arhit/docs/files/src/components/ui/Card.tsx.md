# src/components/ui/Card.tsx

Card primitive — базовая поверхность (контейнер) по pencil lanchHunter.pen. Server-compatible (не client).

**Стили базовой карточки:**
- bg-surface-primary, border border-border, rounded-lg (16px)
- shadow-[0_1px_2px_rgba(0,0,0,0.04)] — лёгкая тень
- padding p-4 (если noPadding=false)

**Пропы (CardProps):**
- noPadding — убирает padding (для медиа на всю ширину)
- interactive — добавляет hover-эффект (shadow) + cursor-pointer
- asChild — зарезервирован для будущего Radix Slot

**Press feedback (Фаза 4):**
- При interactive=true добавляется active:scale-[0.99] transition-transform duration-100 — лёгкий press-эффект карточки
- Хаптик НЕ добавлен — карточки обычно оборачиваются в TransitionLink (Фаза 5), который сам дёргает haptics.tap(); дублировать нельзя

**Подкомпоненты (композиция):**
- CardHeader — flex-col gap-1 mb-3 (обёртка для заголовка + описания)
- CardTitle — <h3> text-base font-semibold text-fg-primary
- CardDescription — <p> text-sm text-fg-secondary
- CardBody — flex-col gap-2 (основной контент)
- CardFooter — flex items-center justify-between mt-3 (футер карточки)

Используется в: ResultCard, LunchCard, StatCard на dashboard.
**Экспорты:** Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter (все forwardRef)
**Зависимости:** @/lib/utils/cn
