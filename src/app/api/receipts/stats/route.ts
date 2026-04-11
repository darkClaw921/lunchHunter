import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { getUserReceiptStats } from "@/lib/db/receipts";

/**
 * GET /api/receipts/stats — агрегированная статистика чеков текущего пользователя.
 *
 * Возвращает { totalSpent, visitCount, categoryBreakdown }.
 * Требует авторизацию.
 */

export async function GET(): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getUserReceiptStats(session.user.id);

  return NextResponse.json(stats);
}
