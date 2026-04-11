import { generateObject } from "ai";
import { z } from "zod";
import { getVisionModel, LLM_MODEL_ID } from "./client";
import { prepareImageForLlm } from "./ocr";

/**
 * OCR чеков (receipt) через vision LLM.
 *
 * Реюзает prepareImageForLlm() из ocr.ts и getVisionModel() из client.ts.
 * Распознаёт позиции чека, итоговую сумму, дату/время и название заведения.
 *
 * Основная функция: `recognizeReceipt(imageBuffer)` — принимает буфер картинки,
 * отправляет в LLM с Zod-схемой `ReceiptOcrResultSchema`.
 * Возвращает структурированный результат распознавания.
 */

export const ReceiptItemSchema = z.object({
  name: z.string().min(1).describe("Название позиции в чеке"),
  quantity: z
    .number()
    .positive()
    .describe("Количество (шт, порций и т.п.)"),
  price: z
    .number()
    .nonnegative()
    .describe("Цена за позицию в рублях (общая за quantity)"),
});

export const ReceiptOcrResultSchema = z.object({
  establishmentName: z
    .string()
    .nullable()
    .describe("Название заведения с чека, если удалось распознать"),
  items: z
    .array(ReceiptItemSchema)
    .describe("Список позиций чека"),
  total: z
    .number()
    .nullable()
    .describe("Итоговая сумма чека в рублях, если указана"),
  date: z
    .string()
    .nullable()
    .describe("Дата чека в формате YYYY-MM-DD, если удалось распознать"),
  time: z
    .string()
    .nullable()
    .describe("Время чека в формате HH:MM, если удалось распознать"),
});

export type ReceiptOcrResult = z.infer<typeof ReceiptOcrResultSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

const SYSTEM_PROMPT = [
  "Ты OCR-система для распознавания кассовых чеков. Внимательно изучи фотографию",
  "чека и извлеки следующую информацию:",
  "",
  "1. establishmentName — название заведения (ресторан, кафе, бар и т.п.),",
  "   обычно указано в верхней части чека. Если не видно — верни null.",
  "",
  "2. items — список позиций чека. Для каждой позиции:",
  "   - name: название блюда/напитка точно как на чеке;",
  "   - quantity: количество (если не указано явно, считай 1);",
  "   - price: итоговая цена за эту строку в рублях (quantity × цена за единицу).",
  "",
  "3. total — итоговая сумма чека (ИТОГО / TOTAL). Если не видна — null.",
  "",
  "4. date — дата чека в формате YYYY-MM-DD. Если не видна — null.",
  "",
  "5. time — время чека в формате HH:MM. Если не видно — null.",
  "",
  "Правила:",
  "- Не придумывай позиции, которых нет на фото.",
  "- Если чек нечитаем или это не чек — верни пустой items и null для остальных полей.",
  "- Цены указывай в рублях как числа (без символа валюты).",
  "- Если видишь скидку как отдельную строку, включи её как позицию с отрицательной ценой.",
  "- Отвечай строго в формате JSON согласно предоставленной схеме.",
].join("\n");

/**
 * Распознаёт чек с фотографии и возвращает структурированный результат.
 * Бросает Error при сетевой/провайдерской ошибке.
 * При нечитаемом чеке возвращает пустой items и null-поля (не ошибку).
 */
export async function recognizeReceipt(
  imageBuffer: Buffer,
): Promise<ReceiptOcrResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Пустой буфер изображения");
  }

  const { dataUrl } = await prepareImageForLlm(imageBuffer);
  const model = getVisionModel();

  try {
    const { object } = await generateObject({
      model,
      schema: ReceiptOcrResultSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Распознай этот кассовый чек. Извлеки все позиции, итого, дату, время и название заведения.",
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
      `Receipt OCR failed (${LLM_MODEL_ID}): ${message}`,
      { cause: err },
    );
  }
}
