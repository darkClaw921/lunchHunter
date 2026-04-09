import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/search/loading.tsx — скелет страницы результатов поиска.
 *
 * Повторяет геометрию реального `page.tsx`:
 * - mobile (<md): header с кнопкой назад + строка поиска, filter chips
 *   row, sort indicator и 6 карточек в колонку (по форме `MobileSearchResults` —
 *   прямоугольник min-h 140px, round 12, внутри заглушка контента слева
 *   и квадрат карты-миниатюры справа).
 * - desktop (≥md): split-view — левая панель 55% с sort row + 6 карточек
 *   72×72 thumbnail, правая панель — серый прямоугольник вместо карты
 *   (повторяет `DesktopSearchResults` shell).
 *
 * Оба варианта выводятся одновременно (`md:hidden` / `hidden md:flex`),
 * чтобы при переходе не было layout-shift ни на mobile, ни на desktop.
 *
 * Server component — Skeleton server-compatible.
 */
export default function SearchLoading(): React.JSX.Element {
  return (
    <>
      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        {/* Header: back button + search input + filter button */}
        <header className="flex items-center gap-3 px-5 pt-4 pb-3">
          <Skeleton width={40} height={40} rounded="9999px" />
          <div className="flex-1">
            <Skeleton height={48} rounded={12} />
          </div>
          <Skeleton width={40} height={40} rounded="9999px" />
        </header>

        {/* Filter chips row */}
        <div className="px-5">
          <div className="flex gap-2 overflow-hidden">
            <Skeleton width={120} height={40} rounded="9999px" />
            <Skeleton width={84} height={40} rounded="9999px" />
            <Skeleton width={116} height={40} rounded="9999px" />
            <Skeleton width={92} height={40} rounded="9999px" />
          </div>
        </div>

        {/* Sort indicator */}
        <div className="px-5 mt-3">
          <Skeleton width={160} height={14} />
        </div>

        {/* 6 result cards — повторяют MobileSearchResults */}
        <div className="px-5 mt-3 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border bg-surface-primary"
              style={{ minHeight: 140 }}
            >
              {/* Left content area */}
              <div className="absolute inset-y-0 left-0 right-[110px] p-4 flex flex-col gap-2 justify-center">
                <Skeleton width="40%" height={12} />
                <Skeleton width="75%" height={16} />
                <div className="flex items-center gap-2 mt-1">
                  <Skeleton width={32} height={14} />
                  <Skeleton width={56} height={18} rounded="9999px" />
                </div>
                <Skeleton width={80} height={22} />
              </div>

              {/* Right map thumbnail area */}
              <div className="absolute top-0 right-0 bottom-0 w-[110px]">
                <Skeleton
                  width="100%"
                  height="100%"
                  rounded={0}
                  className="!rounded-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — split-view shell */}
      <div className="hidden md:flex h-[calc(100vh-64px)]">
        {/* Left panel — results list */}
        <div className="w-[55%] max-w-[790px] flex flex-col bg-surface-primary">
          {/* Sort row */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
            <Skeleton width={96} height={14} />
            <Skeleton width={64} height={32} rounded="9999px" />
            <Skeleton width={96} height={32} rounded="9999px" />
            <Skeleton width={72} height={32} rounded="9999px" />
            <div className="flex-1" />
            <Skeleton width={110} height={14} />
          </div>

          {/* 6 result rows — повторяют DesktopSearchResults */}
          <div className="flex-1 overflow-hidden px-6 py-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl bg-surface-secondary p-4"
              >
                <Skeleton width={72} height={72} rounded={12} />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton width="55%" height={16} />
                  <Skeleton width="70%" height={14} />
                  <div className="flex items-center gap-3 mt-0.5">
                    <Skeleton width={56} height={16} />
                    <Skeleton width={48} height={14} />
                    <Skeleton width={32} height={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — map placeholder */}
        <div className="flex-1 relative bg-surface-secondary overflow-hidden">
          <Skeleton
            width="100%"
            height="100%"
            rounded={0}
            className="absolute inset-0 !rounded-none"
          />
        </div>
      </div>
    </>
  );
}
