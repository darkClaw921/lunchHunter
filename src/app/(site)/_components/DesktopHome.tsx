import { Coins, MapPin, Star } from "lucide-react";
import { FeatureCard } from "@/components/desktop/FeatureCard";
import { SearchHomeForm } from "./SearchHomeForm";
import { HeroFloatingCards } from "./HeroFloatingCards";
import { DesktopPopularRestaurantsGrid } from "./DesktopPopularRestaurantsGrid";
import { cn } from "@/lib/utils/cn";

export interface DesktopHomeRestaurant {
  id: number;
  slug: string;
  name: string;
  category: string;
  rating: number | null;
  distanceMeters: number | null;
  priceAvg: number | null;
  coverUrl: string | null;
}

export interface DesktopHomeHeroMenuItem {
  id: number;
  name: string;
  price: number;
  photoUrl: string | null;
  restaurantName: string;
}

export interface DesktopHomeHeroLunch {
  id: number;
  name: string;
  price: number;
  restaurantName: string;
  timeFrom: string;
  timeTo: string;
}

export interface DesktopHomeProps {
  popularRestaurants: DesktopHomeRestaurant[];
  heroMenuItems?: DesktopHomeHeroMenuItem[];
  heroLunches?: DesktopHomeHeroLunch[];
  className?: string;
}

/**
 * Desktop — Home/Search (frame d5AFP в lanchHunter.pen).
 *
 * Структура (pixel-perfect, 1440px base):
 * - Hero (surface-secondary, padding 80/48, gap 32): заголовок 48/700,
 *   подзаголовок 18/normal, search bar 640px.
 * - Feature row: 3 FeatureCard карточки (Самое дешёвое / Ближе всего /
 *   Лучший рейтинг), padding 48, gap 24.
 * - Популярные рестораны (28/700): 4 карточки в ряд с фото 160px, gap 20,
 *   padding [0,48,48,48].
 *
 * TopNav рендерится из layout — здесь только "body" страницы.
 */
export function DesktopHome({
  popularRestaurants,
  heroMenuItems = [],
  heroLunches = [],
  className,
}: DesktopHomeProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hero */}
      <section className="relative overflow-hidden px-12 pt-20 pb-32 -mb-16 bg-[linear-gradient(180deg,#fbf8f4_0%,#fdf1e6_22%,#ffe4cc_50%,#fdf1e6_78%,#fbf8f4_100%)]">
        {/* Фоновые наклонённые карточки-примеры сервиса */}
        <HeroFloatingCards
          restaurants={popularRestaurants}
          menuItems={heroMenuItems}
          lunches={heroLunches}
        />

        {/* Радиальный оверлей для читаемости текста в центре */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,248,244,0.94)_0%,rgba(251,248,244,0.72)_38%,rgba(251,248,244,0)_70%)]"
        />

        {/* Плавный fade-out в page-bg у нижней границы секции —
            убирает видимый "шов" на стыке с Features. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#fbf8f4]"
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-fg-primary leading-[1.15] text-center max-w-[700px]">
            Найди лучшие блюда рядом с тобой
          </h1>
          <p className="text-[18px] text-fg-secondary text-center max-w-[600px] leading-[1.5]">
            Ищи по цене, расстоянию и рейтингу — мы подберём лучшие варианты
            для обеда рядом с тобой
          </p>
          <div className="w-full max-w-[640px]">
            <SearchHomeForm placeholder="Найти блюдо или ресторан..." />
          </div>
        </div>
      </section>

      {/* Features — pt-32 компенсирует -mb-16 на hero + даёт зазор, чтобы
          плавающие карточки hero не налезали на FeatureCard. */}
      <section className="relative z-10 flex justify-center gap-6 px-12 pt-32 pb-12">
        <FeatureCard
          icon={Coins}
          title="Самое дешёвое"
          description="Находи самые доступные обеды и бизнес-ланчи рядом с тобой"
        />
        <FeatureCard
          icon={MapPin}
          title="Ближе всего"
          description="Сортируй по расстоянию и найди ближайшие места за пару минут"
        />
        <FeatureCard
          icon={Star}
          title="Лучший рейтинг"
          description="Выбирай проверенные рестораны с высокими оценками и отзывами"
        />
      </section>

      {/* Popular restaurants */}
      <section className="flex flex-col gap-6 px-12 pb-12">
        <h2 className="text-[28px] font-bold text-fg-primary">
          Популярные рестораны
        </h2>
        <DesktopPopularRestaurantsGrid items={popularRestaurants} />
      </section>
    </div>
  );
}

export default DesktopHome;
