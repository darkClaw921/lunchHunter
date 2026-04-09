import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  validateSession,
} from "@/lib/auth/session";

/**
 * POST /api/admin/auth/logout
 *
 * Удаляет сессию и очищает cookie.
 */
export async function POST(): Promise<Response> {
  const current = await validateSession();
  if (current) {
    await deleteSession(current.session.id);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
