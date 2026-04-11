import { NextResponse } from "next/server";

/**
 * GET /api/notifications/vapid-public-key
 * Возвращает VAPID public key для подписки на push.
 * Клиент запрашивает ключ в момент subscribe(), чтобы не инлайнить env
 * в клиентский бандл и уметь менять ключ без пересборки фронта.
 */
export async function GET(): Promise<NextResponse> {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key not configured" },
      { status: 500 },
    );
  }

  return NextResponse.json({ publicKey });
}
