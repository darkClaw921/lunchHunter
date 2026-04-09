import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

/**
 * Session module — лёгкая замена lucia-auth v3 (deprecated).
 *
 * - sessionId генерируется как 32 случайных байта в base64url
 * - хранится в httpOnly cookie "lh_session"
 * - expire 7 дней
 * - пишется в таблицу `sessions` из Drizzle-схемы (id, userId, expiresAt)
 *
 * Helpers:
 * - createSession(userId) — создаёт запись + возвращает id
 * - setSessionCookie(id, expiresAt) — ставит cookie
 * - clearSessionCookie() — удаляет cookie
 * - validateSession() — читает cookie, ищет сессию, чистит expired,
 *   возвращает { user, session } или null. Продлевает срок при <50% остатке.
 * - requireAdmin() — проверяет сессию + role === 'admin' (для server components/API)
 */

export const SESSION_COOKIE_NAME = "lh_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_RENEW_THRESHOLD_MS = SESSION_DURATION_MS / 2;

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
  tgId: string | null;
  tgUsername: string | null;
  avatarUrl: string | null;
}

export interface SessionRow {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface ValidateResult {
  user: SessionUser;
  session: SessionRow;
}

function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<SessionRow> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, userId, expiresAt };
}

export async function setSessionCookie(
  id: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function validateSession(): Promise<ValidateResult | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const row = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      userEmail: users.email,
      userName: users.name,
      userRole: users.role,
      userTgId: users.tgId,
      userTgUsername: users.tgUsername,
      userAvatarUrl: users.avatarUrl,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await deleteSession(row.sessionId);
    return null;
  }

  // Renew session if more than half elapsed
  let expiresAt = row.expiresAt;
  if (row.expiresAt.getTime() - now < SESSION_RENEW_THRESHOLD_MS) {
    expiresAt = new Date(now + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt })
      .where(eq(sessions.id, row.sessionId));
  }

  return {
    session: {
      id: row.sessionId,
      userId: row.userId,
      expiresAt,
    },
    user: {
      id: row.userId,
      email: row.userEmail,
      name: row.userName,
      role: row.userRole,
      tgId: row.userTgId,
      tgUsername: row.userTgUsername,
      avatarUrl: row.userAvatarUrl,
    },
  };
}

export async function requireAdmin(): Promise<ValidateResult | null> {
  const result = await validateSession();
  if (!result) return null;
  if (result.user.role !== "admin") return null;
  return result;
}
