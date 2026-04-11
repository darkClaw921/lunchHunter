import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";

/**
 * POST /api/notifications/subscribe
 * Сохранить push-подписку для текущего пользователя.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    subscription?: {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
  };

  const sub = body.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json(
      { error: "Invalid subscription payload" },
      { status: 400 },
    );
  }

  // Upsert: delete existing then insert
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, sub.endpoint));

  await db.insert(pushSubscriptions).values({
    userId: session.user.id,
    endpoint: sub.endpoint,
    keysJson: JSON.stringify(sub.keys),
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/notifications/subscribe
 * Удалить push-подписку.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint));

  return NextResponse.json({ ok: true });
}
