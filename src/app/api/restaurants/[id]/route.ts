import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  restaurants,
  menuCategories,
  menuItems,
  restaurantPhotos,
} from "@/lib/db/schema";

/**
 * GET /api/restaurants/[id]
 *
 * Возвращает ресторан + фотогалерею + меню, сгруппированное по категориям.
 * Поддерживает id как число (primary key) или slug (текст) через path-параметр.
 */

export interface RestaurantMenuItemDto {
  id: number;
  categoryId: number | null;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
}

export interface RestaurantMenuCategoryDto {
  id: number;
  name: string;
  sortOrder: number;
  items: RestaurantMenuItemDto[];
}

export interface RestaurantDto {
  id: number;
  name: string;
  slug: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  description: string | null;
  priceAvg: number | null;
  rating: number | null;
  coverUrl: string | null;
  tags: string[];
  photos: { id: number; url: string }[];
  menu: RestaurantMenuCategoryDto[];
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  ctx: RouteContext,
): Promise<NextResponse<RestaurantDto | { error: string }>> {
  const { id } = await ctx.params;

  const numericId = Number(id);
  const isNumeric = Number.isFinite(numericId) && /^\d+$/.test(id);

  const restaurant = isNumeric
    ? await db.query.restaurants.findFirst({
        where: eq(restaurants.id, numericId),
      })
    : await db.query.restaurants.findFirst({
        where: eq(restaurants.slug, id),
      });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const photosRows = await db
    .select({
      id: restaurantPhotos.id,
      url: restaurantPhotos.url,
    })
    .from(restaurantPhotos)
    .where(eq(restaurantPhotos.restaurantId, restaurant.id))
    .orderBy(asc(restaurantPhotos.sortOrder));

  const categoriesRows = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.restaurantId, restaurant.id))
    .orderBy(asc(menuCategories.sortOrder));

  const itemsRows = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id))
    .orderBy(asc(menuItems.id));

  const menu: RestaurantMenuCategoryDto[] = categoriesRows.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    items: itemsRows
      .filter((i) => i.categoryId === cat.id && i.status === "active")
      .map((i) => ({
        id: i.id,
        categoryId: i.categoryId,
        name: i.name,
        description: i.description,
        price: i.price,
        photoUrl: i.photoUrl,
      })),
  }));

  // Позиции без категории (categoryId = null) добавим отдельным псевдо-разделом,
  // если такие есть.
  const uncategorized = itemsRows.filter(
    (i) => i.categoryId === null && i.status === "active",
  );
  if (uncategorized.length > 0) {
    menu.push({
      id: -1,
      name: "Прочее",
      sortOrder: 999,
      items: uncategorized.map((i) => ({
        id: i.id,
        categoryId: null,
        name: i.name,
        description: i.description,
        price: i.price,
        photoUrl: i.photoUrl,
      })),
    });
  }

  let tags: string[] = [];
  if (restaurant.tagsJson) {
    try {
      const parsed = JSON.parse(restaurant.tagsJson) as unknown;
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === "string");
      }
    } catch {
      tags = [];
    }
  }

  const dto: RestaurantDto = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    category: restaurant.category,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    phone: restaurant.phone,
    website: restaurant.website,
    description: restaurant.description,
    priceAvg: restaurant.priceAvg,
    rating: restaurant.rating,
    coverUrl: restaurant.coverUrl,
    tags,
    photos: photosRows,
    menu,
  };

  return NextResponse.json(dto);
}
