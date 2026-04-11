import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  deleteSession,
} from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Удаляет текущую сессию из БД и очищает httpOnly cookie lh_session.
 */
export async function POST(): Promise<Response> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
