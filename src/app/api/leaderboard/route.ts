import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { getLeaderboard, getUserPercentile } from "@/lib/db/receipts";

/**
 * GET /api/leaderboard?category=total|beer|wine|tips — топ пользователей.
 *
 * Возвращает { leaderboard: [...], userPercentile: number }.
 * Категории: "total" (по умолчанию), "beer", "wine", "tips" и другие
 * из receipt-categories.ts.
 * Требует авторизацию.
 */

const VALID_CATEGORIES = new Set([
  "total",
  "beer",
  "wine",
  "cocktail",
  "spirits",
  "soft_drink",
  "coffee",
  "tea",
  "food",
  "dessert",
  "tips",
  "hookah",
]);

export async function GET(req: Request): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "total";

  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `Invalid category. Valid: ${[...VALID_CATEGORIES].join(", ")}` },
      { status: 400 },
    );
  }

  const [leaderboard, userPercentile] = await Promise.all([
    getLeaderboard(category),
    getUserPercentile(session.user.id, category),
  ]);

  return NextResponse.json({ leaderboard, userPercentile });
}
