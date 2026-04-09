import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  recognizeWeeklyLunch,
  WEEKDAY_TO_NUMBER,
  flattenLunchDay,
  type Weekday,
} from "@/lib/llm/lunch-ocr";

/**
 * POST /api/admin/business-lunch/ocr — multipart upload фото недельного
 * бизнес-ланча, распознавание через LLM и возврат нормализованной структуры.
 *
 * Защищён admin-сессией. Принимает `file` (≤ 10 MB). Возвращает:
 * {
 *   days: Array<{
 *     weekday: number,       // 1..7 (Пн=1)
 *     weekdayName: Weekday,  // 'monday'...'sunday'
 *     courses: LunchCourses, // { salad?, soup?, main?, drink?, dessert? }
 *     flat: string[]         // плоский список блюд для UI чипсов
 *   }>
 * }
 * Ошибки LLM → 422.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    const result = await recognizeWeeklyLunch(buf);
    const days = result.days.map((d) => {
      const weekdayName: Weekday = d.weekday;
      return {
        weekday: WEEKDAY_TO_NUMBER[weekdayName],
        weekdayName,
        courses: d.courses,
        flat: flattenLunchDay(d),
      };
    });
    return NextResponse.json({ days });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM OCR failed";
    console.error("[admin/business-lunch/ocr]", err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
