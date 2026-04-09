import { NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import {
  isFavorited,
  isValidFavoriteTargetType,
  toggleFavorite,
} from "@/lib/db/favorites";
import { FAVORITE_TARGET_TYPES } from "@/lib/db/schema";

/**
 * /api/favorites
 *
 * POST { targetType: "restaurant"|"menu_item"|"lunch", targetId: number }
 *   — переключает элемент в избранном текущего пользователя.
 *   Требует активной сессии (cookie lh_session). 401 если не авторизован.
 *   Возвращает { favorited: boolean }.
 *
 * GET ?targetType=...&targetId=... — вернуть состояние одного элемента.
 */
const bodySchema = z.object({
  targetType: z.enum(FAVORITE_TARGET_TYPES),
  targetId: z.number().int().positive(),
});

export async function POST(req: Request): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await toggleFavorite(
    session.user.id,
    parsed.data.targetType,
    parsed.data.targetId,
  );
  return NextResponse.json(result);
}

export async function GET(req: Request): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ favorited: false });
  }
  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType");
  const targetIdRaw = url.searchParams.get("targetId");
  const targetId = Number(targetIdRaw);
  if (!isValidFavoriteTargetType(targetType) || !Number.isFinite(targetId)) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const favorited = await isFavorited(session.user.id, targetType, targetId);
  return NextResponse.json({ favorited });
}
