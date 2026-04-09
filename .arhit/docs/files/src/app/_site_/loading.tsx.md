# src/app/(site)/loading.tsx

Общий fallback Next.js App Router для всех сегментов route group (site). Рендерится автоматически во время навигации, когда server component страницы ещё не готов. Показывает каркас контента: top bar placeholder (логотип/поиск кнопка) + 3 крупных Skeleton блока 120-160px высоты. Mobile (md:hidden) и desktop (hidden md:block) варианты выводятся одновременно — по аналогии с остальными страницами (site). Server component — не использует 'use client'. Использует примитив Skeleton из @/components/ui/Skeleton.
