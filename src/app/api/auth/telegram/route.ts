import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { verifyInitData } from "@/lib/auth/telegram";
import { createSession, setSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/telegram
 *
 * Принимает { initData: string } — сырой `window.Telegram.WebApp.initData`
 * из Telegram Mini App. Валидирует подпись через verifyInitData(),
 * апсертит users по tg_id (создаёт нового или обновляет имя/username/avatar),
 * создаёт сессию через src/lib/auth/session.createSession и ставит httpOnly
 * cookie. Возвращает { ok: true, user }.
 *
 * Бот-токен читается из process.env.TELEGRAM_BOT_TOKEN.
 *
 * Ошибки:
 *  - 400 невалидное тело
 *  - 500 если TELEGRAM_BOT_TOKEN не задан
 *  - 401 если подпись невалидна или initData просрочен
 */
const bodySchema = z.object({
  initData: z.string().min(1),
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
      { error: "Invalid body: expected { initData: string }" },
      { status: 400 },
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const tgUser = verifyInitData(parsed.data.initData, botToken);
  if (!tgUser) {
    return NextResponse.json(
      { error: "Invalid or expired initData" },
      { status: 401 },
    );
  }

  const tgId = String(tgUser.id);
  const fullName =
    tgUser.last_name && tgUser.last_name.length > 0
      ? `${tgUser.first_name} ${tgUser.last_name}`
      : tgUser.first_name;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.tgId, tgId))
    .get();

  let userId: string;

  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        name: fullName,
        tgUsername: tgUser.username ?? null,
        avatarUrl: tgUser.photo_url ?? null,
      })
      .where(eq(users.id, existing.id));
  } else {
    userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      tgId,
      tgUsername: tgUser.username ?? null,
      name: fullName,
      avatarUrl: tgUser.photo_url ?? null,
      role: "user",
    });
  }

  const session = await createSession(userId);
  await setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      tgId,
      name: fullName,
      username: tgUser.username ?? null,
      avatarUrl: tgUser.photo_url ?? null,
    },
  });
}
