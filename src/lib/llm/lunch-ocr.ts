import { generateObject } from "ai";
import { z } from "zod";
import { getVisionModel, LLM_MODEL_ID } from "./client";
import { prepareImageForLlm } from "./ocr";

/**
 * OCR недельного бизнес-ланча через vision LLM.
 *
 * Основная функция: `recognizeWeeklyLunch(imageBuffer)` — распознаёт
 * фотографию меню бизнес-ланча на неделю (Пн-Пт, иногда + Сб/Вс) и
 * возвращает структуру из дней с курсами (салат/суп/горячее/напиток/десерт).
 *
 * Изображение готовится через `prepareImageForLlm` (sharp resize 2048px).
 * Ответ модели валидируется Zod-схемой `WeeklyLunchSchema`. Если день
 * невидим/отсутствует на фото — модели велено пропустить его.
 */

export const WEEKDAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const WeekdaySchema = z.enum(WEEKDAY_NAMES);
export type Weekday = z.infer<typeof WeekdaySchema>;

/**
 * Маппинг строкового weekday → номер дня недели ISO (1..7, Пн=1).
 */
export const WEEKDAY_TO_NUMBER: Record<Weekday, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

export const LunchCoursesSchema = z.object({
  salad: z
    .string()
    .nullable()
    .optional()
    .describe("Название салата на этот день (если есть)"),
  soup: z
    .string()
    .nullable()
    .optional()
    .describe("Название супа на этот день (если есть)"),
  main: z
    .string()
    .nullable()
    .optional()
    .describe("Название горячего блюда на этот день (если есть)"),
  drink: z
    .string()
    .nullable()
    .optional()
    .describe("Название напитка (компот, чай) на этот день"),
  dessert: z
    .string()
    .nullable()
    .optional()
    .describe("Название десерта, если указан"),
});

export type LunchCourses = z.infer<typeof LunchCoursesSchema>;

export const LunchDaySchema = z.object({
  weekday: WeekdaySchema,
  courses: LunchCoursesSchema,
});

export type LunchDay = z.infer<typeof LunchDaySchema>;

export const WeeklyLunchSchema = z.object({
  days: z.array(LunchDaySchema),
});

export type WeeklyLunchResult = z.infer<typeof WeeklyLunchSchema>;

const SYSTEM_PROMPT = [
  "Ты OCR недельного бизнес-ланча ресторана. На фотографии меню на",
  "несколько дней недели (обычно Пн-Пт). Для каждого дня извлеки блюда",
  "по категориям:",
  "- salad — салат;",
  "- soup — суп/первое блюдо;",
  "- main — горячее/второе блюдо;",
  "- drink — напиток (компот, морс, чай);",
  "- dessert — десерт, если есть.",
  "Если какой-то курс на день отсутствует — поставь null.",
  "Используй английские ключи дней: monday, tuesday, wednesday, thursday,",
  "friday, saturday, sunday. Возвращай только те дни, что реально есть на фото.",
  "Не придумывай блюда, пиши названия как в меню.",
  "Отвечай строго в формате JSON по предоставленной схеме.",
].join(" ");

/**
 * Преобразует результат OCR недельного ланча в массив плоских курсов
 * по дню недели (формат, удобный для UI-wizarda, где на каждый день
 * хранится список строк).
 */
export function flattenLunchDay(day: LunchDay): string[] {
  const out: string[] = [];
  const c = day.courses;
  if (c.salad) out.push(c.salad);
  if (c.soup) out.push(c.soup);
  if (c.main) out.push(c.main);
  if (c.drink) out.push(c.drink);
  if (c.dessert) out.push(c.dessert);
  return out;
}

/**
 * Распознаёт недельное меню бизнес-ланча с фотографии.
 * Бросает Error при сетевой/провайдерской ошибке.
 */
export async function recognizeWeeklyLunch(
  imageBuffer: Buffer,
): Promise<WeeklyLunchResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Пустой буфер изображения");
  }

  const { dataUrl } = await prepareImageForLlm(imageBuffer);
  const model = getVisionModel();

  try {
    const { object } = await generateObject({
      model,
      schema: WeeklyLunchSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Распознай недельный бизнес-ланч с этой фотографии.",
            },
            {
              type: "image",
              image: dataUrl,
            },
          ],
        },
      ],
    });
    return object;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `LLM Weekly-Lunch OCR failed (${LLM_MODEL_ID}): ${message}`,
      { cause: err },
    );
  }
}
