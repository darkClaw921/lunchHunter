import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/restaurants — создаёт ресторан.
 *
 * Требует admin-сессию. Валидирует тело через Zod. Вставляет в
 * restaurants + R*Tree индекс (restaurants_rtree) для геопоиска.
 */
const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug: a-z, 0-9, -"),
  category: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  priceAvg: z.number().int().nonnegative().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  hoursJson: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tagsJson: z.string().optional().nullable(),
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const website = data.website && data.website !== "" ? data.website : null;

  const [inserted] = await db
    .insert(restaurants)
    .values({
      name: data.name,
      slug: data.slug,
      category: data.category,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      phone: data.phone ?? null,
      website,
      description: data.description ?? null,
      priceAvg: data.priceAvg ?? null,
      coverUrl: data.coverUrl ?? null,
      hoursJson: data.hoursJson ?? null,
      status: data.status,
      tagsJson: data.tagsJson ?? null,
    })
    .returning({ id: restaurants.id });

  if (!inserted) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  // R*Tree индекс обновляется автоматически триггерами
  // `restaurants_rtree_ai` из raw-migrations.ts.

  return NextResponse.json({ id: inserted.id });
}
