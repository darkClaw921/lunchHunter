# src/components/ui/Skeleton.tsx

Skeleton — server-compatible React примитив-плейсхолдер с shimmer-эффектом. Используется в loading.tsx на каждом тяжёлом сегменте (search, map, restaurant/[id], business-lunch, profile, favorites) для мгновенного каркаса контента во время SSR.

## Экспорты

### SkeletonProps (interface)
Extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>:
- width?: number | string — ширина через inline style (не через tailwind)
- height?: number | string — высота через inline style
- rounded?: number | string — переопределяет дефолтный borderRadius из .skeleton
- className?: string — доп. tailwind-классы, сливаются с 'skeleton' через cn()
- style?: React.CSSProperties — доп. inline-стили (сливаются с width/height/rounded)
- ...props — все остальные HTMLAttributes<HTMLDivElement>

### Skeleton(props: SkeletonProps): JSX.Element
Функциональный компонент. Рендерит <div className={cn('skeleton', className)} style={mergedStyle} aria-hidden />. mergedStyle собирается из width/height/rounded и переданного style — явные undefined не попадают в итоговый объект.

## Зависимости
- @/lib/utils/cn — утилита для объединения tailwind-классов
- Базовый класс .skeleton с shimmer keyframes определён в src/app/globals.css

## Barrel-экспорт
Реэкспортирован из src/components/ui/index.ts:
`export { Skeleton, type SkeletonProps } from './Skeleton';`

## Используется в
- src/app/(site)/loading.tsx — общий fallback (Фаза 3)
- src/app/(site)/search/loading.tsx — скелет поиска (Фаза 3)
- src/app/(site)/map/loading.tsx — скелет карты (Фаза 3)
- src/app/(site)/restaurant/[id]/loading.tsx — скелет hero+menu (Фаза 3)
- src/app/(site)/business-lunch/loading.tsx (Фаза 3)
- src/app/(site)/profile/loading.tsx (Фаза 3)
- src/app/(site)/favorites/loading.tsx (Фаза 3)

## Пример

```tsx
import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className='p-4 space-y-3'>
      <Skeleton width='100%' height={48} />
      <Skeleton width='60%' height={20} />
      <Skeleton width={120} height={120} rounded={12} />
    </div>
  );
}
```

## Ограничения
- Не является client component — можно рендерить из server component
- aria-hidden='true' — скелет скрыт от screen reader (контент ещё не загружен)
- Shimmer отключается через @media (prefers-reduced-motion: reduce) в globals.css — сам компонент не знает об этом.
