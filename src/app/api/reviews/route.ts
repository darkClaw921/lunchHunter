import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { recognizeReceipt } from "@/lib/llm/receipt-ocr";
import { matchEstablishmentName } from "@/lib/utils/fuzzy-match";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import { createReview, getReviewsByRestaurant } from "@/lib/db/reviews";
import { createReceipt } from "@/lib/db/receipts";

/**
 * POST /api/reviews — создание отзыва с фото чека.
 *
 * 1. validateSession() — требует авторизацию
 * 2. multipart/form-data: file (чек), restaurantId, text, rating
 * 3. Валидация: rating 1-5, text не пустой
 * 4. OCR чека → recognizeReceipt(buf)
 * 5. Fuzzy match → если confidence < 0.3 → 422
 * 6. Сохранить фото через sharp → /uploads/
 * 7. Insert в reviews + receipts
 * 8. Return { id, status }
 *
 * GET /api/reviews?restaurantId=N — approved отзывы с данными авторов.
 */

const MAX_WIDTH = 1600;
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: Request): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // --- Parse fields ---
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file field" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const restaurantIdStr = form.get("restaurantId");
  const text = form.get("text");
  const ratingStr = form.get("rating");

  if (!restaurantIdStr || typeof restaurantIdStr !== "string") {
    return NextResponse.json(
      { error: "Missing restaurantId" },
      { status: 400 },
    );
  }
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty text" },
      { status: 400 },
    );
  }
  if (!ratingStr || typeof ratingStr !== "string") {
    return NextResponse.json({ error: "Missing rating" }, { status: 400 });
  }

  const restaurantId = Number(restaurantIdStr);
  const rating = Number(ratingStr);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json(
      { error: "Invalid restaurantId" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be 1-5" },
      { status: 400 },
    );
  }

  // --- Validate restaurant exists ---
  const restaurant = await db
    .select({ id: restaurants.id, name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .get();

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurant not found" },
      { status: 404 },
    );
  }

  // --- OCR receipt ---
  const buf = Buffer.from(await file.arrayBuffer());
  let ocrResult;
  try {
    ocrResult = await recognizeReceipt(buf);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Receipt OCR failed", details: message },
      { status: 500 },
    );
  }

  // --- Fuzzy match ---
  const matchResult = matchEstablishmentName(
    ocrResult.establishmentName,
    restaurant.name,
  );

  if (!matchResult.match) {
    return NextResponse.json(
      {
        error: "Receipt does not match restaurant",
        ocrEstablishment: ocrResult.establishmentName,
        restaurant: restaurant.name,
        confidence: matchResult.confidence,
      },
      { status: 422 },
    );
  }

  // --- Save image ---
  const webp = await sharp(buf)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }

  const imageName = `${randomUUID()}.webp`;
  const filePath = path.join(UPLOADS_DIR, imageName);
  await writeFile(filePath, webp);
  const imageUrl = `/uploads/${imageName}`;

  // --- Insert review + receipt ---
  const itemsJson = ocrResult.items.length > 0
    ? JSON.stringify(ocrResult.items)
    : null;

  const review = await createReview({
    userId: session.user.id,
    restaurantId,
    text: text.trim(),
    rating,
    receiptImageUrl: imageUrl,
    receiptTotal: ocrResult.total,
    receiptDate: ocrResult.date,
    receiptItemsJson: itemsJson,
    receiptEstablishmentName: ocrResult.establishmentName,
    matchConfidence: matchResult.confidence,
  });

  await createReceipt({
    userId: session.user.id,
    restaurantId,
    imageUrl,
    total: ocrResult.total,
    date: ocrResult.date,
    itemsJson,
    establishmentName: ocrResult.establishmentName,
  });

  return NextResponse.json({ id: review.id, status: review.status });
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const restaurantIdStr = searchParams.get("restaurantId");

  if (!restaurantIdStr) {
    return NextResponse.json(
      { error: "Missing restaurantId" },
      { status: 400 },
    );
  }

  const restaurantId = Number(restaurantIdStr);
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json(
      { error: "Invalid restaurantId" },
      { status: 400 },
    );
  }

  const reviews = await getReviewsByRestaurant(restaurantId);

  return NextResponse.json({ reviews });
}
