import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { reviews } from "@/lib/db/schema";

/**
 * GET /api/reviews/:id/receipt-image — возвращает URL фото чека.
 *
 * Только для админов (requireAdmin()). Возвращает { url } с путём к
 * изображению чека для указанного отзыва.
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const review = await db
    .select({ receiptImageUrl: reviews.receiptImageUrl })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ url: review.receiptImageUrl });
}
