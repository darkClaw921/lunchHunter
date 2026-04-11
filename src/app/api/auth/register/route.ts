import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/register
 * Регистрирует end-user по email + password + name.
 * Создаёт запись users (role='user'), хэширует пароль argon2id,
 * открывает сессию и ставит httpOnly cookie lh_session.
 */
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(64),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте введённые данные" },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();

  await db.insert(users).values({
    id,
    email: normalizedEmail,
    passwordHash,
    name: name.trim(),
    role: "user",
  });

  const session = await createSession(id);
  await setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({ ok: true });
}
