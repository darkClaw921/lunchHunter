import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { validateSession } from "@/lib/auth/session";
import { recognizeReceipt } from "@/lib/llm/receipt-ocr";
import { createReceipt, getUserReceipts } from "@/lib/db/receipts";

/**
 * POST /api/receipts — standalone загрузка чека из профиля.
 *
 * validateSession(), parse file, OCR, save to /uploads/, insert в receipts.
 * Не привязан к конкретному ресторану (restaurantId опционален).
 *
 * GET /api/receipts — список чеков текущего пользователя.
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

  // Optional restaurantId
  const restaurantIdStr = form.get("restaurantId");
  let restaurantId: number | null = null;
  if (restaurantIdStr && typeof restaurantIdStr === "string") {
    const parsed = Number(restaurantIdStr);
    if (Number.isInteger(parsed) && parsed > 0) {
      restaurantId = parsed;
    }
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

  // --- Insert receipt ---
  const itemsJson = ocrResult.items.length > 0
    ? JSON.stringify(ocrResult.items)
    : null;

  const receipt = await createReceipt({
    userId: session.user.id,
    restaurantId,
    imageUrl,
    total: ocrResult.total,
    date: ocrResult.date,
    itemsJson,
    establishmentName: ocrResult.establishmentName,
  });

  return NextResponse.json({
    id: receipt.id,
    ocr: ocrResult,
  });
}

export async function GET(): Promise<Response> {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const receipts = await getUserReceipts(session.user.id);

  return NextResponse.json({ receipts });
}
