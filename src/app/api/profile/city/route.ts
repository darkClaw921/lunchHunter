import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { AVAILABLE_CITIES } from "@/lib/cities";

/**
 * POST /api/profile/city — сохраняет выбранный город в users.city.
 * Принимает JSON { city: string }. Город валидируется по AVAILABLE_CITIES.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const city =
    payload && typeof payload === "object" && "city" in payload
      ? (payload as { city: unknown }).city
      : null;
  if (typeof city !== "string" || !AVAILABLE_CITIES.includes(city)) {
    return NextResponse.json({ error: "invalid_city" }, { status: 400 });
  }

  await db.update(users).set({ city }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true, city });
}
