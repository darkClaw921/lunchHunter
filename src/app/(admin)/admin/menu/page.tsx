import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  restaurants,
  menuCategories,
  menuItems,
} from "@/lib/db/schema";
import { MenuManagementClient } from "./_components/MenuManagementClient";

/**
 * Admin Menu Management /admin/menu — выбор ресторана, табы категорий,
 * таблица позиций, форма добавления. Плюс карточка «Загрузить меню из фото»
 * (заглушка под Phase 7 OCR).
 *
 * Поддерживает query param ?restaurantId=... Если не указан, берёт первый.
 */
interface PageProps {
  searchParams: Promise<{ restaurantId?: string }>;
}

export default async function AdminMenuPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const sp = await searchParams;

  const allRestaurants = await db
    .select({ id: restaurants.id, name: restaurants.name })
    .from(restaurants)
    .orderBy(asc(restaurants.name));

  const selectedId = sp.restaurantId
    ? Number.parseInt(sp.restaurantId, 10)
    : (allRestaurants[0]?.id ?? null);

  const categories = selectedId
    ? await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, selectedId))
        .orderBy(asc(menuCategories.sortOrder))
    : [];

  const items = selectedId
    ? await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, selectedId))
    : [];

  return (
    <MenuManagementClient
      restaurants={allRestaurants}
      selectedRestaurantId={selectedId}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        status: i.status,
        categoryId: i.categoryId,
        photoUrl: i.photoUrl,
      }))}
    />
  );
}
