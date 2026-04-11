import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:admin@lunchhunter.local",
    VAPID_PUBLIC,
    VAPID_PRIVATE,
  );
}

/**
 * POST /api/notifications/send
 * Отправить push-уведомление всем подписчикам (только для admin).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    url?: string;
  };

  if (!body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body ?? "",
    url: body.url ?? "/",
  });

  const subs = await db.select().from(pushSubscriptions);

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const keys = JSON.parse(sub.keysJson) as {
      p256dh: string;
      auth: string;
    };

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys,
        },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: subs.length });
}
