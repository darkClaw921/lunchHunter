import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { prepareImageForLlm } from "@/lib/llm/ocr";

/**
 * Unit-тест pure image-pipeline'а OCR.
 *
 * Мы не дёргаем реальную LLM (`recognizeMenu` — это требует сеть и OPENROUTER_API_KEY).
 * Проверяем только `prepareImageForLlm`: что он принимает произвольный
 * buffer, ресайзит через sharp и возвращает корректный data URL.
 */

async function makeRedSquare(size: number): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();
}

describe("prepareImageForLlm", () => {
  it("produces a JPEG data URL for a small buffer", async () => {
    const buf = await makeRedSquare(256);
    const { dataUrl, mediaType } = await prepareImageForLlm(buf);

    expect(mediaType).toBe("image/jpeg");
    expect(dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan("data:image/jpeg;base64,".length);
  });

  it("downscales images larger than 2048px", async () => {
    const buf = await makeRedSquare(3000);
    const { dataUrl } = await prepareImageForLlm(buf);

    // Декодируем результат обратно через sharp, убеждаемся что размер ≤ 2048.
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    const resized = await sharp(Buffer.from(base64, "base64")).metadata();
    expect(resized.width ?? 0).toBeLessThanOrEqual(2048);
    expect(resized.height ?? 0).toBeLessThanOrEqual(2048);
    expect(resized.format).toBe("jpeg");
  });

  it("does not enlarge images smaller than 2048px", async () => {
    const buf = await makeRedSquare(512);
    const { dataUrl } = await prepareImageForLlm(buf);

    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    const resized = await sharp(Buffer.from(base64, "base64")).metadata();
    expect(resized.width).toBe(512);
    expect(resized.height).toBe(512);
  });
});
