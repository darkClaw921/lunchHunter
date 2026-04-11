/**
 * Fuzzy-match для сопоставления названий заведений.
 *
 * Использует Dice coefficient (bigram overlap) на нормализованных строках.
 * Применяется для проверки, что название заведения на чеке соответствует
 * ресторану в базе данных.
 *
 * Экспорт:
 *  - matchEstablishmentName(ocrName, restaurantName) — основная функция
 *  - diceCoefficient(a, b) — вспомогательная, для тестирования
 *
 * Порог совпадения: >= 0.3 (достаточно низкий для учёта сокращений,
 * аббревиатур и разных форматов написания).
 */

const MATCH_THRESHOLD = 0.3;

/**
 * Нормализует строку: lowercase, убирает пунктуацию и лишние пробелы.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Разбивает строку на биграммы (пары соседних символов).
 * Пробелы не удаляются — они участвуют в биграммах.
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Вычисляет Dice coefficient между двумя строками.
 * Формула: 2 * |intersection| / (|bigrams_a| + |bigrams_b|)
 * Возвращает число от 0 до 1.
 */
export function diceCoefficient(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 1;
  if (normA.length < 2 || normB.length < 2) return 0;

  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);

  const bigramCountB = new Map<string, number>();
  for (const bg of bigramsB) {
    bigramCountB.set(bg, (bigramCountB.get(bg) ?? 0) + 1);
  }

  let intersectionSize = 0;
  for (const bg of bigramsA) {
    const count = bigramCountB.get(bg);
    if (count && count > 0) {
      intersectionSize++;
      bigramCountB.set(bg, count - 1);
    }
  }

  return (2 * intersectionSize) / (bigramsA.length + bigramsB.length);
}

/**
 * Сопоставляет название заведения из OCR чека с названием ресторана из БД.
 *
 * @param ocrName — название с чека (может быть null)
 * @param restaurantName — название ресторана из базы
 * @returns { match: boolean, confidence: number }
 */
export function matchEstablishmentName(
  ocrName: string | null,
  restaurantName: string,
): { match: boolean; confidence: number } {
  if (!ocrName || ocrName.trim().length === 0) {
    return { match: false, confidence: 0 };
  }

  const confidence = diceCoefficient(ocrName, restaurantName);
  return {
    match: confidence >= MATCH_THRESHOLD,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}
