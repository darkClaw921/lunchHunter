import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { recognizeMenu } from "@/lib/llm/ocr";

/**
 * POST /api/admin/menu/ocr — multipart upload с фото меню, распознавание
 * через LLM (OpenRouter + grok-4-fast) и возврат массива позиций для preview.
 *
 * Защищён admin-сессией. Принимает `file` (≤ 10 MB). Возвращает
 * { items: MenuItemDraft[] }. Ошибки LLM → 422 с сообщением.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const items = await recognizeMenu(buf);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM OCR failed";
    console.error("[admin/menu/ocr]", err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
