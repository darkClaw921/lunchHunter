import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { BackButton } from "./_components/BackButton";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  restaurants,
  menuCategories,
  menuItems,
  restaurantPhotos,
} from "@/lib/db/schema";
import { haversineDistance } from "@/lib/geo/haversine";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { RestaurantMenu } from "./_components/RestaurantMenu";
import { DesktopRestaurantDetail } from "./_components/DesktopRestaurantDetail";
import { RestaurantMapModal } from "./_components/RestaurantMapModal";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { validateSession } from "@/lib/auth/session";
import { getFavoritedIds, isFavorited } from "@/lib/db/favorites";
import {
  getReviewsByRestaurant,
  getRestaurantReviewStats,
} from "@/lib/db/reviews";
import { ReviewSection } from "./_components/ReviewSection";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const numericId = Number(id);
  const isNumeric = Number.isFinite(numericId) && /^\d+$/.test(id);

  const restaurant = isNumeric
    ? await db.query.restaurants.findFirst({
        where: eq(restaurants.id, numericId),
      })
    : await db.query.restaurants.findFirst({
        where: eq(restaurants.slug, id),
      });

  if (!restaurant) notFound();

  const [categoriesRows, itemsRows, photosRows] = await Promise.all([
    db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurant.id))
      .orderBy(asc(menuCategories.sortOrder)),
    db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurant.id))
      .orderBy(asc(menuItems.id)),
    db
      .select({ url: restaurantPhotos.url })
      .from(restaurantPhotos)
      .where(eq(restaurantPhotos.restaurantId, restaurant.id))
      .orderBy(asc(restaurantPhotos.sortOrder)),
  ]);

  const distanceMeters = Math.round(
    haversineDistance(DEFAULT_LAT, DEFAULT_LNG, restaurant.lat, restaurant.lng),
  );

  const categories = categoriesRows.map((c) => ({
    id: c.id,
    name: c.name,
    items: itemsRows
      .filter((i) => i.categoryId === c.id && i.status === "active")
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
      })),
  }));

  const heroUrl = photosRows[0]?.url ?? restaurant.coverUrl ?? null;

  // Избранное: статус для ресторана + множество id избранных блюд,
  // чтобы RestaurantMenu мог отрисовать сердечки рядом с каждым пунктом.
  const session = await validateSession();
  const isAuthenticated = session !== null;
  const restaurantFavorited = session
    ? await isFavorited(session.user.id, "restaurant", restaurant.id)
    : false;
  const favoritedMenuItemIds = session
    ? await getFavoritedIds(
        session.user.id,
        "menu_item",
        itemsRows.map((i) => i.id),
      )
    : new Set<number>();
  const favoritedMenuItemIdsArr = Array.from(favoritedMenuItemIds);

  // Fetch reviews
  const [reviewRows, reviewStats] = await Promise.all([
    getReviewsByRestaurant(restaurant.id),
    getRestaurantReviewStats(restaurant.id),
  ]);
  const isAdmin = session?.user.role === "admin";

  // Serialize reviews for client components (Date → ISO string)
  const reviews = reviewRows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorAvatarUrl: r.authorAvatarUrl,
    rating: r.rating,
    text: r.text,
    receiptTotal: r.receiptTotal,
    receiptDate: r.receiptDate,
    receiptItemsJson: r.receiptItemsJson,
    createdAt: r.createdAt.toISOString(),
  }));

  // Parse hours_json → формат "HH:MM — HH:MM" (first available day) или fallback.
  const hoursLabel = ((): string => {
    if (!restaurant.hoursJson) return "—";
    try {
      const parsed = JSON.parse(restaurant.hoursJson) as unknown;
      if (parsed && typeof parsed === "object") {
        const values = Object.values(parsed as Record<string, unknown>);
        for (const v of values) {
          if (typeof v === "string" && v.length > 0) return v;
          if (
            Array.isArray(v) &&
            v.length === 2 &&
            typeof v[0] === "string" &&
            typeof v[1] === "string"
          ) {
            return `${v[0]} — ${v[1]}`;
          }
        }
      }
    } catch {
      // ignore
    }
    return "—";
  })();

  return (
    <>
      <DesktopRestaurantDetail
        restaurantId={restaurant.id}
        name={restaurant.name}
        category={restaurant.category}
        address={restaurant.address}
        phone={restaurant.phone}
        hours={hoursLabel}
        rating={restaurant.rating}
        heroUrl={heroUrl}
        categories={categories}
        highlightQuery={query}
        lat={restaurant.lat}
        lng={restaurant.lng}
        restaurantFavorited={restaurantFavorited}
        favoritedMenuItemIds={favoritedMenuItemIdsArr}
        isAuthenticated={isAuthenticated}
        reviews={reviews}
        reviewStats={reviewStats}
        isAdmin={isAdmin}
        className="hidden md:flex"
      />
      <div className="flex flex-col md:hidden">
      {/* Hero — landing target для shared-element VT через
          `viewTransitionName: 'restaurant-image-${restaurant.id}'`. Парный
          элемент к обложкам карточек ресторана из списков
          (NearbyRestaurantsRow, MobileSearchResults, DesktopSearchResults,
          MobileMapView, DesktopPopularRestaurantsGrid) — все карточки
          используют то же имя с numeric restaurant id, поэтому браузер
          автоматически морфит пару. `data-vt-target` используется
          manualFlipMorph как querySelector target на устройствах без VT API
          (Telegram WebView). Mobile- и desktop-версии не конфликтуют,
          потому что `hidden`/`md:hidden` → `display: none`, а скрытые
          элементы не участвуют в снимке VT API. */}
      <div className="relative">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt={restaurant.name}
            width={1200}
            height={700}
            fetchPriority="high"
            data-vt-target={`restaurant-image-${restaurant.id}`}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
            className="h-[220px] w-full object-cover bg-surface-secondary"
          />
        ) : (
          <div
            data-vt-target={`restaurant-image-${restaurant.id}`}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
            className="h-[220px] w-full bg-surface-secondary grid place-items-center text-fg-muted text-sm"
          >
            {restaurant.category}
          </div>
        )}
        <BackButton variant="icon" restaurantId={restaurant.id} />
      </div>

      {/* Info */}
      <div className="px-5 pt-4">
        <h1
          style={{ viewTransitionName: `restaurant-title-${restaurant.id}` }}
          className="text-[24px] font-bold text-fg-primary leading-tight min-h-[2rem]"
        >
          {restaurant.name}
        </h1>
        <div className="mt-2 flex items-center gap-1 text-fg-secondary">
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  "h-4 w-4 " +
                  (restaurant.rating !== null && i < Math.round(restaurant.rating)
                    ? "fill-current"
                    : "")
                }
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-[13px] font-medium ml-1 text-fg-primary">
            {formatRating(restaurant.rating)}
          </span>
          <span className="text-[12px] text-fg-muted">
            ({reviewStats.count} {reviewStats.count === 1 ? "отзыв" : reviewStats.count >= 2 && reviewStats.count <= 4 ? "отзыва" : "отзывов"})
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[13px] text-fg-secondary">
          <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>{restaurant.address}</span>
          <RestaurantMapModal
            name={restaurant.name}
            address={restaurant.address}
            lat={restaurant.lat}
            lng={restaurant.lng}
          />
        </div>
        <div className="mt-1 text-[13px] text-accent font-medium">
          📍 {formatDistance(distanceMeters)} от вас
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 mt-5">
        <h2 className="text-[17px] font-semibold text-fg-primary mb-3">Меню</h2>
        <RestaurantMenu
          categories={categories}
          highlightQuery={query}
          favoritedMenuItemIds={favoritedMenuItemIdsArr}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Favorite button */}
      <div className="px-5 mt-6 mb-4">
        <FavoriteButton
          targetType="restaurant"
          targetId={restaurant.id}
          initialFavorited={restaurantFavorited}
          isAuthenticated={isAuthenticated}
          variant="button"
        />
      </div>

      {/* Reviews */}
      <div className="px-5 mb-6">
        <ReviewSection
          reviews={reviews}
          reviewStats={reviewStats}
          restaurantId={restaurant.id}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
        />
      </div>
      </div>
    </>
  );
}

// Helper reused by RestaurantMenu
export function formatMenuPrice(price: number): string {
  return formatPrice(price);
}
