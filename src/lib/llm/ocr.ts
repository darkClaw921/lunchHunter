import sharp from "sharp";
import { generateObject } from "ai";
import { z } from "zod";
import { getVisionModel, LLM_MODEL_ID } from "./client";

/**
 * OCR меню ресторана через vision LLM (OpenRouter + x-ai/grok-4-fast).
 *
 * Основная функция: `recognizeMenu(imageBuffer)` — принимает буфер картинки,
 * ресайзит через sharp до max 2048px, кодирует в base64 data URL, отправляет
 * в generateObject с Zod-схемой `MenuItemsSchema`. Возвращает массив валидных
 * позиций меню (`MenuItemDraft[]`).
 *
 * Если модель не вернула ни одной валидной позиции — функция возвращает
 * пустой массив (не ошибку). Ошибки сети/провайдера пробрасываются.
 */

export const MenuItemDraftSchema = z.object({
  name: z.string().min(1).describe("Название блюда/позиции меню"),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Описание/состав блюда, если есть"),
  price: z
    .number()
    .int()
    .nonnegative()
    .describe("Цена в рублях (целое число, без валютного символа)"),
  category: z
    .string()
    .nullable()
    .optional()
    .describe("Категория блюда: Салаты, Супы, Горячее, Напитки, Десерты и т.д."),
});

export const MenuItemsSchema = z.object({
  items: z.array(MenuItemDraftSchema),
});

export type MenuItemDraft = z.infer<typeof MenuItemDraftSchema>;

const MAX_IMAGE_DIMENSION = 2048;

const SYSTEM_PROMPT = [
  "Ты OCR меню ресторана. Внимательно изучи фотографию меню и извлеки все",
  "позиции, которые ты видишь. Для каждой позиции верни:",
  "- name: точное название блюда (как на фото, без изменений);",
  "- description: описание/состав, если указан на фото, иначе null;",
  "- price: цена в рублях, только целое число (округли при необходимости);",
  "- category: категория блюда (Салаты, Супы, Горячее, Напитки, Десерты, Закуски и т.п.).",
  "Не придумывай блюда, которых нет на фото. Не включай заголовки категорий",
  "как отдельные позиции. Если цена не видна или не применима — пропусти позицию.",
  "Отвечай строго в формате JSON согласно предоставленной схеме.",
].join(" ");

/**
 * Готовит буфер изображения: разворачивает по EXIF, ресайзит до 2048px,
 * конвертирует в JPEG (quality 85). Возвращает data URL для отправки в LLM.
 */
export async function prepareImageForLlm(
  imageBuffer: Buffer,
): Promise<{ dataUrl: string; mediaType: "image/jpeg" }> {
  const jpeg = await sharp(imageBuffer)
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  return { dataUrl, mediaType: "image/jpeg" };
}

/**
 * Распознаёт меню с фотографии и возвращает список валидных позиций.
 * Бросает Error с понятным сообщением при сетевой/провайдерской ошибке.
 */
export async function recognizeMenu(
  imageBuffer: Buffer,
): Promise<MenuItemDraft[]> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Пустой буфер изображения");
  }

  const { dataUrl } = await prepareImageForLlm(imageBuffer);
  const model = getVisionModel();

  try {
    const { object } = await generateObject({
      model,
      schema: MenuItemsSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Распознай все позиции меню с этой фотографии.",
            },
            {
              type: "image",
              image: dataUrl,
            },
          ],
        },
      ],
    });
    return object.items;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `LLM OCR failed (${LLM_MODEL_ID}): ${message}`,
      { cause: err },
    );
  }
}
