import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { clearUserSearchHistory } from "@/lib/db/search-history";

/**
 * DELETE /api/profile/search-history — очищает всю историю поиска
 * текущего пользователя. Требует валидную сессию.
 */
export async function DELETE(): Promise<NextResponse> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await clearUserSearchHistory(session.user.id);
  return NextResponse.json({ ok: true });
}
