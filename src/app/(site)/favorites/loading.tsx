import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/favorites/loading.tsx — скелет страницы избранного.
 *
 * Повторяет реальный `page.tsx`:
 * - Mobile (<md): header "Избранное" + 6 mobile-карточек в колонку
 *   (inline layout — h-24 thumb слева + info справа, по образцу
 *   `RestaurantCardMobile` и favorite menu item cards).
 * - Desktop (≥md): bg-surface-secondary header + одна секция с заголовком
 *   и сеткой 2×3 карточек (в `md:grid-cols-2 xl:grid-cols-4` реальная
 *   раскладка; скелет даёт 6 карточек с 160px hero вверху и body внизу
 *   по образцу `RestaurantCardDesktop`).
 *
 * Server component.
 */
export default function FavoritesLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <section className="hidden md:block bg-surface-secondary px-12 py-12">
        <div className="flex flex-col gap-2">
          <Skeleton width={260} height={44} />
          <Skeleton width={200} height={18} />
        </div>
      </section>

      {/* Mobile header */}
      <header className="md:hidden px-5 pt-5 pb-3 flex flex-col gap-1.5">
        <Skeleton width={160} height={28} />
        <Skeleton width={120} height={14} />
      </header>

      <div className="flex flex-col gap-8 md:gap-10 px-5 md:px-12 pb-8 md:pb-12">
        <section>
          {/* Section title */}
          <div className="mb-3 md:mb-4 flex items-baseline gap-2">
            <Skeleton width={140} height={22} />
            <Skeleton width={20} height={14} />
          </div>

          {/* Desktop grid 2 × 3 = 6 карточек */}
          <div className="hidden md:grid gap-5 grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border-light bg-surface-primary shadow-sm overflow-hidden flex flex-col"
              >
                {/* Cover 160px */}
                <div className="h-40 w-full bg-surface-secondary relative">
                  <Skeleton
                    width="100%"
                    height="100%"
                    rounded={0}
                    className="absolute inset-0 !rounded-none"
                  />
                </div>
                {/* Body */}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton width="65%" height={18} />
                    <Skeleton width={40} height={14} />
                  </div>
                  <Skeleton width={80} height={20} rounded="9999px" />
                  <div className="flex items-start gap-1.5">
                    <Skeleton width={14} height={14} rounded="9999px" />
                    <Skeleton width="80%" height={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile list — 6 карточек inline layout */}
          <div className="md:hidden flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface-primary overflow-hidden"
              >
                <div className="flex gap-3">
                  <Skeleton
                    width={96}
                    height={96}
                    rounded={0}
                    className="shrink-0 !rounded-none"
                  />
                  <div className="flex-1 min-w-0 py-2.5 pr-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton width="60%" height={14} />
                      <Skeleton width={32} height={12} />
                    </div>
                    <Skeleton width={60} height={16} rounded="9999px" />
                    <div className="flex items-start gap-1">
                      <Skeleton width={12} height={12} rounded="9999px" />
                      <Skeleton width="75%" height={11} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
