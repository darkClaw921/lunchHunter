import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Telegram Mini App initData verification.
 *
 * Реализует алгоритм из официальной документации:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Алгоритм:
 *  1. Разобрать query-string initDataRaw в пары ключ=значение.
 *  2. Извлечь поле `hash` (его нужно сравнить).
 *  3. Собрать data_check_string из остальных пар, отсортированных по ключу,
 *     в формате "key=value" и соединённых "\n".
 *  4. Вычислить secret_key = HMAC-SHA256(ключ="WebAppData", сообщение=bot_token).
 *  5. computed_hash = HMAC-SHA256(ключ=secret_key, сообщение=data_check_string), hex.
 *  6. Сравнить timingSafeEqual(computed_hash, hash). Если равны — initData валиден.
 *
 * Дополнительно:
 *  - auth_date должен быть не старше MAX_AUTH_AGE_SECONDS (24 часа).
 *  - Поле `user` — URL-decoded JSON, распарсить и нормализовать.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * Верифицирует initData, полученный от Telegram Mini App.
 *
 * @param initDataRaw — сырое значение `window.Telegram.WebApp.initData`
 *   (query-string формат).
 * @param botToken — секретный токен бота (из @BotFather).
 * @returns Объект TelegramUser при валидной подписи и свежем auth_date,
 *   либо null если проверка не прошла.
 */
export function verifyInitData(
  initDataRaw: string,
  botToken: string,
): TelegramUser | null {
  if (!initDataRaw || !botToken) return null;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initDataRaw);
  } catch {
    return null;
  }

  const hash = params.get("hash");
  if (!hash) return null;

  const authDateStr = params.get("auth_date");
  if (!authDateStr) return null;

  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate) || authDate <= 0) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) {
    return null;
  }

  // Собираем data_check_string: все пары кроме hash, отсортированные по ключу.
  const entries: Array<[string, string]> = [];
  params.forEach((value, key) => {
    if (key === "hash") return;
    entries.push([key, value]);
  });
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  // secret_key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // computed_hash = HMAC-SHA256(secret_key, data_check_string)
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Константное сравнение во избежание timing-атак.
  const expectedBuf = Buffer.from(hash, "hex");
  const actualBuf = Buffer.from(computedHash, "hex");
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, actualBuf)) return null;

  // Парсим user. Поле `user` — URL-decoded JSON, URLSearchParams уже
  // раскодировал percent-encoding, так что просто JSON.parse.
  const userRaw = params.get("user");
  if (!userRaw) return null;

  let userJson: unknown;
  try {
    userJson = JSON.parse(userRaw);
  } catch {
    return null;
  }

  if (!userJson || typeof userJson !== "object") return null;
  const u = userJson as Record<string, unknown>;

  if (typeof u.id !== "number" || typeof u.first_name !== "string") {
    return null;
  }

  const result: TelegramUser = {
    id: u.id,
    first_name: u.first_name,
  };
  if (typeof u.last_name === "string") result.last_name = u.last_name;
  if (typeof u.username === "string") result.username = u.username;
  if (typeof u.photo_url === "string") result.photo_url = u.photo_url;
  if (typeof u.language_code === "string") {
    result.language_code = u.language_code;
  }
  if (typeof u.is_premium === "boolean") result.is_premium = u.is_premium;
  if (typeof u.allows_write_to_pm === "boolean") {
    result.allows_write_to_pm = u.allows_write_to_pm;
  }

  return result;
}
