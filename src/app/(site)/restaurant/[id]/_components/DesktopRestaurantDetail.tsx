import { MapPin, Clock3, Phone, Star } from "lucide-react";
import { RestaurantMenu, type MenuCategory } from "./RestaurantMenu";
import { BackButton } from "./BackButton";
import { formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

export interface DesktopRestaurantDetailProps {
  restaurantId: number;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  hours: string;
  rating: number | null;
  heroUrl: string | null;
  categories: MenuCategory[];
  highlightQuery: string;
  /** Restaurant coordinates — used for the mini-map. */
  lat: number;
  lng: number;
  restaurantFavorited: boolean;
  favoritedMenuItemIds: number[];
  isAuthenticated: boolean;
  className?: string;
}

interface Review {
  author: string;
  rating: number;
  text: string;
}

const DEMO_REVIEWS: readonly Review[] = [
  {
    author: "Анна К.",
    rating: 5,
    text: "Отличное место! Пиво всегда свежее, кухня на высоте. Рекомендую всем словно с чистотой.",
  },
  {
    author: "Дмитрий М.",
    rating: 4,
    text: "Хороший выбор крафтового пива. Немного шумно по вечерам, но атмосфера уютная.",
  },
  {
    author: "Елена В.",
    rating: 5,
    text: "Бизнес-ланч отменный: сытно, быстро и вкусно. Официанты внимательные, обязательно вернусь.",
  },
];

/**
 * Desktop — Restaurant Detail (frame Yi1h9 в lanchHunter.pen).
 *
 * Структура:
 * - Hero-баннер 220px с фото и dark-to-transparent gradient overlay,
 *   название ресторана 28/700 белым + подзаголовок (категория) поверх
 *   слева внизу (padding 32/28).
 * - Info-строка (surface-primary, padding 20/32): accent rating-badge
 *   (pill), адрес (MapPin + text), часы работы (Clock3), телефон (Phone).
 * - Двухколоночный layout (gap 32, padding 0/32):
 *   • Левая колонка (flex-1): заголовок "Меню" 20/700, RestaurantMenu tabs.
 *   • Правая колонка (420px): "Местоположение" (mini-map placeholder 180px),
 *     адрес, затем "Отзывы" (3 карточки surface-secondary).
 */
export function DesktopRestaurantDetail({
  restaurantId,
  name,
  category,
  address,
  phone,
  hours,
  rating,
  heroUrl,
  categories,
  highlightQuery,
  lat,
  lng,
  restaurantFavorited,
  favoritedMenuItemIds,
  isAuthenticated,
  className,
}: DesktopRestaurantDetailProps): React.JSX.Element {
  const miniMapMarkers: MapMarker[] = [
    {
      id: 0,
      lat,
      lng,
      label: name,
      position: address,
    },
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Back button row */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-border-light bg-surface-primary">
        <BackButton variant="pill" restaurantId={restaurantId} />
        <FavoriteButton
          targetType="restaurant"
          targetId={restaurantId}
          initialFavorited={restaurantFavorited}
          isAuthenticated={isAuthenticated}
          variant="icon"
          className="h-10 w-10"
        />
      </div>

      {/* Hero — landing target для shared-element VT через
          `viewTransitionName: 'restaurant-image-${restaurantId}'`. Парный
          элемент к обложкам карточек из DesktopPopularRestaurantsGrid и
          DesktopSearchResults (обе используют то же имя с numeric id).
          Mobile-версия (в page.tsx) в момент десктопного рендера скрыта
          через `md:hidden` (= `display: none`), поэтому не участвует в
          снимке VT API — коллизии имён нет. `data-vt-target` используется
          manualFlipMorph как querySelector target на устройствах без VT. */}
      <div className="relative h-[220px] w-full overflow-hidden bg-surface-secondary">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt={name}
            width={1200}
            height={700}
            fetchPriority="high"
            data-vt-target={`restaurant-image-${restaurantId}`}
            style={{ viewTransitionName: `restaurant-image-${restaurantId}` }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-vt-target={`restaurant-image-${restaurantId}`}
            style={{ viewTransitionName: `restaurant-image-${restaurantId}` }}
            className="h-full w-full grid place-items-center text-fg-muted text-sm"
          >
            {category}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
        {/* Title */}
        <div className="absolute left-8 bottom-8 flex flex-col gap-1.5">
          <h1
            style={{ viewTransitionName: `restaurant-title-${restaurantId}` }}
            className="text-[28px] font-bold text-white leading-tight min-h-[2.25rem]"
          >
            {name}
          </h1>
          <p className="text-[14px] text-white/75">{category} · $$</p>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-6 bg-surface-primary px-8 py-5 border-b border-border-light">
        <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-white text-[14px] font-semibold">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          {formatRating(rating)}
        </span>
        <div className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
          <MapPin className="h-4 w-4 text-fg-muted" aria-hidden="true" />
          <span>{address}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
          <Clock3 className="h-4 w-4 text-fg-muted" aria-hidden="true" />
          <span>{hours}</span>
        </div>
        {phone ? (
          <div className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
            <Phone className="h-4 w-4 text-fg-muted" aria-hidden="true" />
            <span>{phone}</span>
          </div>
        ) : null}
      </div>

      {/* Two columns */}
      <div className="flex gap-8 px-8 py-6">
        {/* Left: menu */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-bold text-fg-primary mb-4">Меню</h2>
          <RestaurantMenu
            categories={categories}
            highlightQuery={highlightQuery}
            favoritedMenuItemIds={favoritedMenuItemIds}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Right: map + reviews */}
        <aside className="w-[420px] shrink-0 flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[16px] font-semibold text-fg-primary">
              Местоположение
            </h3>
            <div className="relative h-[200px] rounded-2xl bg-surface-secondary overflow-hidden">
              <MapView
                markers={miniMapMarkers}
                center={{ lat, lng }}
                zoom={15}
                className="absolute inset-0"
              />
            </div>
            <p className="text-[13px] text-fg-secondary">{address}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[16px] font-semibold text-fg-primary">
              Отзывы
            </h3>
            {DEMO_REVIEWS.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-2xl bg-surface-secondary p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-accent grid place-items-center text-white text-[12px] font-semibold">
                    {r.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <span className="text-[13px] font-semibold text-fg-primary">
                    {r.author}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400 ml-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < r.rating ? "fill-current" : "",
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[12px] text-fg-secondary leading-relaxed">
                  {r.text}
                </p>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default DesktopRestaurantDetail;
