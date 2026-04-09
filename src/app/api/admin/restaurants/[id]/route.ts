import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

/**
 * PATCH /api/admin/restaurants/:id — частичное обновление ресторана.
 * DELETE /api/admin/restaurants/:id — удаление ресторана (каскадно
 * удалит связанные записи через onDelete: "cascade").
 *
 * Требует admin-сессию. Валидирует тело через Zod (все поля опциональны
 * для PATCH). R*Tree индекс обновляется автоматически триггерами.
 */
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug: a-z, 0-9, -")
    .optional(),
  category: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  lat: z.number().gte(-90).lte(90).optional(),
  lng: z.number().gte(-180).lte(180).optional(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  priceAvg: z.number().int().nonnegative().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  hoursJson: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tagsJson: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(idStr: string): number | null {
  const n = Number.parseInt(idStr, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function PATCH(
  req: Request,
  ctx: RouteContext,
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numericId = parseId(id);
  if (numericId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const patch: Partial<typeof restaurants.$inferInsert> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.slug !== undefined) patch.slug = data.slug;
  if (data.category !== undefined) patch.category = data.category;
  if (data.address !== undefined) patch.address = data.address;
  if (data.lat !== undefined) patch.lat = data.lat;
  if (data.lng !== undefined) patch.lng = data.lng;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.website !== undefined) {
    patch.website =
      data.website && data.website !== "" ? data.website : null;
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.priceAvg !== undefined) patch.priceAvg = data.priceAvg;
  if (data.coverUrl !== undefined) patch.coverUrl = data.coverUrl;
  if (data.hoursJson !== undefined) patch.hoursJson = data.hoursJson;
  if (data.status !== undefined) patch.status = data.status;
  if (data.tagsJson !== undefined) patch.tagsJson = data.tagsJson;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.id, numericId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.update(restaurants).set(patch).where(eq(restaurants.id, numericId));

  return NextResponse.json({ id: numericId });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext,
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numericId = parseId(id);
  if (numericId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.id, numericId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(restaurants).where(eq(restaurants.id, numericId));

  return NextResponse.json({ id: numericId });
}
