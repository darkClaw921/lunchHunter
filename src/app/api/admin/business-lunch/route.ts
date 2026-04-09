import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { businessLunches, businessLunchDays } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/business-lunch — создаёт бизнес-ланч + записи на дни.
 *
 * Body: { restaurantId, name, price, timeFrom, timeTo, daysMask, days: [{weekday, courses}] }
 * weekday: 1 (Пн) ... 7 (Вс). courses — массив строк.
 */
const timePattern = /^\d{2}:\d{2}$/;

const dayCourse = z.object({
  weekday: z.number().int().min(1).max(7),
  courses: z.array(z.string().min(1)).min(1),
});

const schema = z.object({
  restaurantId: z.number().int().positive(),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  timeFrom: z.string().regex(timePattern),
  timeTo: z.string().regex(timePattern),
  daysMask: z.number().int().min(0).max(127),
  days: z.array(dayCourse),
  status: z.enum(["active", "inactive"]).default("active"),
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const [lunch] = await db
    .insert(businessLunches)
    .values({
      restaurantId: data.restaurantId,
      name: data.name,
      price: data.price,
      timeFrom: data.timeFrom,
      timeTo: data.timeTo,
      daysMask: data.daysMask,
      status: data.status,
    })
    .returning({ id: businessLunches.id });

  if (!lunch) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  for (const d of data.days) {
    await db.insert(businessLunchDays).values({
      lunchId: lunch.id,
      weekday: d.weekday,
      coursesJson: JSON.stringify(d.courses),
    });
  }

  return NextResponse.json({ id: lunch.id });
}
