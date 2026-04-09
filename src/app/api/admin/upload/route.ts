import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/upload — multipart upload с ресайзом через sharp.
 *
 * Требует admin-сессию. Принимает multipart form-data поле `file`.
 * Изображение ресайзится до max 1600px по ширине, конвертируется в WebP
 * (quality 85) и сохраняется в /public/uploads/{uuid}.webp. Возвращает
 * { url: "/uploads/{uuid}.webp" }.
 */

const MAX_WIDTH = 1600;
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: Request): Promise<Response> {
  const session = await requireAdmin();
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

  const buf = Buffer.from(await file.arrayBuffer());

  const webp = await sharp(buf)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }

  const name = `${randomUUID()}.webp`;
  const filePath = path.join(UPLOADS_DIR, name);
  await writeFile(filePath, webp);

  return NextResponse.json({ url: `/uploads/${name}` });
}
