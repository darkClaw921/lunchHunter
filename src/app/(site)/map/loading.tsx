import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/map/loading.tsx — скелет страницы /map.
 *
 * Реальная страница — mobile-first (см. `src/app/(site)/map/page.tsx`):
 * - Search input сверху (padding 5, top 4)
 * - `MobileMapView`: fullscreen-like map area (min-h 55vh) с floating
 *   RadiusSelector сверху, и bottom-sheet с 2-мя ближайшими результатами.
 *
 * Скелет повторяет эту раскладку — одна широкая карточка карты
 * и 2 строки bottom-sheet. Карта-скелет занимает основную часть вьюпорта,
 * чтобы при переходе `page.tsx → skeleton` не было layout-shift.
 *
 * Server component.
 */
export default function MapLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-64px)]">
      {/* Search form (повторяет SearchHomeForm высоту) */}
      <div className="px-5 pt-4">
        <Skeleton height={48} rounded={12} />
      </div>

      {/* Map area — fills remaining space */}
      <div className="relative flex-1 min-h-[55vh] mt-3">
        <Skeleton
          width="100%"
          height="100%"
          rounded={0}
          className="absolute inset-0 !rounded-none"
        />

        {/* Floating radius selector pill (top-center, как в MobileMapView) */}
        <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
          <Skeleton width={260} height={44} rounded="9999px" />
        </div>
      </div>

      {/* Bottom sheet — 2 строки ближайших результатов */}
      <div className="px-5 pt-4 pb-6 flex flex-col gap-2 bg-surface-primary border-t border-border-light">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-primary p-3"
          >
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <Skeleton width="60%" height={16} />
              <Skeleton width="80%" height={14} />
            </div>
            <Skeleton width={56} height={22} rounded="9999px" />
          </div>
        ))}
      </div>
    </div>
  );
}
