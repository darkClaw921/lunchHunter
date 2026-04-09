import { getNearbyRestaurants } from "@/lib/db/queries";
import {
  RestaurantIndexCardDesktop,
  RestaurantIndexCardMobile,
} from "./_components/RestaurantIndexCards";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

/**
 * Restaurant index page — список всех опубликованных ресторанов.
 *
 * Используется ссылкой "Рестораны" из TopNav (desktop) и доступен напрямую.
 * Server component, читает данные через `getNearbyRestaurants`.
 *
 * Layout:
 * - Mobile (`<md`): вертикальный список карточек, по дизайну похож на
 *   секцию «Рядом с вами» Home, но в полноразмерном вертикальном виде.
 * - Desktop (`md+`): сетка `xl:grid-cols-4 md:grid-cols-2`, аналогичная
 *   секции «Популярные рестораны» из DesktopHome.
 *
 * Карточки вынесены в client-компоненты
 * {@link RestaurantIndexCardDesktop}/{@link RestaurantIndexCardMobile} из
 * `_components/RestaurantIndexCards.tsx`, чтобы можно было использовать
 * {@link usePrefetchImage} hook для image prefetch на
 * onPointerEnter/onPointerDown (ANIMATIONS_GUIDE §9 long-press prefetch).
 */
export default async function RestaurantIndexPage(): Promise<React.JSX.Element> {
  const restaurants = await getNearbyRestaurants({
    userLat: DEFAULT_LAT,
    userLng: DEFAULT_LNG,
    limit: 50,
  });

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-col">
        <section className="bg-surface-secondary px-12 py-12">
          <h1 className="text-[36px] font-bold text-fg-primary leading-tight">
            Все рестораны
          </h1>
          <p className="mt-2 text-[16px] text-fg-secondary">
            {restaurants.length} мест рядом с вами
          </p>
        </section>

        <section className="px-12 py-10">
          {restaurants.length === 0 ? (
            <div className="py-20 text-center text-fg-muted">
              Пока нет опубликованных ресторанов
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {restaurants.map((r) => (
                <RestaurantIndexCardDesktop key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        <header className="px-5 pt-5 pb-3">
          <h1 className="text-[22px] font-bold text-fg-primary">
            Все рестораны
          </h1>
          <p className="mt-0.5 text-[13px] text-fg-secondary">
            {restaurants.length} мест рядом
          </p>
        </header>

        <div className="px-5 pb-6 flex flex-col gap-3">
          {restaurants.length === 0 ? (
            <div className="py-10 text-center text-sm text-fg-muted">
              Пока нет опубликованных ресторанов
            </div>
          ) : (
            restaurants.map((r) => (
              <RestaurantIndexCardMobile key={r.id} r={r} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
