import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { menuItems, menuCategories } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/menu — создаёт позицию меню.
 *
 * Требует admin-сессию. FTS5 индекс (menu_items_fts) обновляется
 * автоматически триггерами из raw-migrations.ts.
 *
 * Body: { restaurantId, categoryId?, name, description?, price, photoUrl?, status? }
 * Также поддерживает action=create-category для создания категории.
 */
const itemSchema = z.object({
  action: z.literal("create-item").default("create-item"),
  restaurantId: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().int().nonnegative(),
  photoUrl: z.string().nullable().optional(),
  status: z.enum(["active", "hidden"]).default("active"),
});

const categorySchema = z.object({
  action: z.literal("create-category"),
  restaurantId: z.number().int().positive(),
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative().default(0),
});

export async function POST(req: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const asCategory = categorySchema.safeParse(body);
  if (asCategory.success) {
    const [row] = await db
      .insert(menuCategories)
      .values({
        restaurantId: asCategory.data.restaurantId,
        name: asCategory.data.name,
        sortOrder: asCategory.data.sortOrder,
      })
      .returning({ id: menuCategories.id });
    return NextResponse.json({ id: row?.id });
  }

  const asItem = itemSchema.safeParse(body);
  if (!asItem.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: asItem.error.flatten() },
      { status: 400 },
    );
  }

  const data = asItem.data;
  const [row] = await db
    .insert(menuItems)
    .values({
      restaurantId: data.restaurantId,
      categoryId: data.categoryId ?? null,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      photoUrl: data.photoUrl ?? null,
      status: data.status,
    })
    .returning({ id: menuItems.id });

  return NextResponse.json({ id: row?.id });
}
