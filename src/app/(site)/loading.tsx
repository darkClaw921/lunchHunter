import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/loading.tsx — общий fallback для всех сегментов внутри route group
 * `(site)`, если в конкретном сегменте нет своего `loading.tsx`.
 *
 * Рендерится Next.js автоматически во время навигации, пока server component
 * соответствующей страницы ещё не готов. Поскольку shell (TopNav/BottomTabBar)
 * уже рендерится из `layout.tsx` и не ремонтируется при переходе, здесь
 * достаточно показать «контент-скелет»: верхний top-bar placeholder и
 * несколько крупных блоков, повторяющих визуальную массу реального контента.
 *
 * Mobile и desktop варианты выводятся одновременно с `md:hidden` /
 * `hidden md:block`, по аналогии с остальными страницами `(site)`.
 *
 * Server component. Никакого `"use client"` — чтобы хаус мог стримить HTML
 * без гидрации на этой ноде.
 */
export default function SiteLoading(): React.JSX.Element {
  return (
    <>
      {/* Mobile (<md) — колонка 430px */}
      <div className="flex flex-col md:hidden">
        {/* Top bar (header placeholder) */}
        <header className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Skeleton width={36} height={36} rounded="9999px" />
            <Skeleton width={120} height={18} />
          </div>
          <Skeleton width={40} height={40} rounded="9999px" />
        </header>

        {/* Three large content blocks */}
        <div className="flex flex-col gap-4 px-5 mt-2">
          <Skeleton height={120} rounded={16} />
          <Skeleton height={120} rounded={16} />
          <Skeleton height={120} rounded={16} />
        </div>
      </div>

      {/* Desktop (≥md) — полноширинный layout 1440px */}
      <div className="hidden md:flex md:flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-12 py-6">
          <Skeleton width={180} height={24} />
          <Skeleton width={320} height={40} rounded={9999} />
        </div>

        {/* Three large content blocks */}
        <div className="flex flex-col gap-6 px-12">
          <Skeleton height={160} rounded={20} />
          <Skeleton height={160} rounded={20} />
          <Skeleton height={160} rounded={20} />
        </div>
      </div>
    </>
  );
}
