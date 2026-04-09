import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/business-lunch/loading.tsx — скелет страницы /business-lunch.
 *
 * Повторяет реальный `page.tsx`:
 * - Mobile (<md): header "Бизнес-ланчи" + filter chips row + sort label +
 *   5 карточек в колонку (rounded 2xl, border, p-4). Каждая карточка имеет
 *   левую колонку (название ресторана, часы, список курсов, rating+distance)
 *   и правую (цена крупным).
 * - Desktop (≥md): hero-баннер 260px (серый — фон gradient заменён на
 *   Skeleton), filter row 56px, 6 карточек в grid-cols-3 с фото 180px и
 *   body с названием, ценой, часами, курсами и rating.
 *
 * Server component.
 */
export default function BusinessLunchLoading(): React.JSX.Element {
  return (
    <>
      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3">
          <Skeleton width={180} height={28} />
          <Skeleton width={40} height={40} rounded="9999px" />
        </header>

        {/* Filter pills row */}
        <div className="px-5">
          <div className="flex gap-2 overflow-hidden">
            <Skeleton width={130} height={36} rounded="9999px" />
            <Skeleton width={84} height={36} rounded="9999px" />
            <Skeleton width={84} height={36} rounded="9999px" />
            <Skeleton width={84} height={36} rounded="9999px" />
          </div>
        </div>

        {/* Sort label */}
        <div className="px-5 mt-3">
          <Skeleton width={180} height={14} />
        </div>

        {/* 5 cards */}
        <div className="px-5 mt-3 flex flex-col gap-3 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface-primary p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  <Skeleton width="70%" height={18} />
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="85%" height={14} />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton width={32} height={14} />
                    <Skeleton width={56} height={18} rounded="9999px" />
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Skeleton width={92} height={18} rounded="9999px" />
                  <Skeleton width={80} height={26} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex md:flex-col">
        {/* Hero 260px */}
        <section className="flex flex-col items-center justify-center gap-5 px-10 py-12 h-[260px] bg-surface-secondary relative">
          <Skeleton
            width="100%"
            height="100%"
            rounded={0}
            className="absolute inset-0 !rounded-none"
          />
          <div className="relative z-10 flex flex-col items-center gap-5">
            <Skeleton width={440} height={44} />
            <Skeleton width={520} height={18} />
            <Skeleton width={640} height={56} rounded="9999px" />
          </div>
        </section>

        {/* Filter row */}
        <div className="flex items-center gap-3 h-14 px-10 bg-surface-primary border-b border-border">
          <Skeleton width={150} height={36} rounded="9999px" />
          <Skeleton width={92} height={36} rounded="9999px" />
          <Skeleton width={92} height={36} rounded="9999px" />
          <Skeleton width={92} height={36} rounded="9999px" />
          <Skeleton width={64} height={36} rounded="9999px" />
          <div className="flex-1" />
          <Skeleton width={100} height={14} />
        </div>

        {/* Grid 3 × 2 = 6 cards */}
        <section className="bg-surface-secondary px-10 py-6">
          <div className="grid grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface-primary border border-border-light overflow-hidden shadow-sm flex flex-col"
              >
                {/* Cover 180px */}
                <div className="relative h-[180px] w-full bg-surface-secondary">
                  <Skeleton
                    width="100%"
                    height="100%"
                    rounded={0}
                    className="absolute inset-0 !rounded-none"
                  />
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2 p-5">
                  <Skeleton width="65%" height={18} />
                  <Skeleton width={96} height={28} />
                  <Skeleton width="55%" height={14} />
                  <Skeleton width="92%" height={14} />
                  <Skeleton width="75%" height={14} />
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-border-light">
                    <Skeleton width={48} height={14} />
                    <Skeleton width={36} height={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
