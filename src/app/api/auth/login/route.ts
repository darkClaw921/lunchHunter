import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/login
 * Логинит end-user по email + password. Принимает любую роль
 * (в отличие от /api/admin/auth/login, который пускает только admin).
 */
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get();

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({ ok: true });
}
