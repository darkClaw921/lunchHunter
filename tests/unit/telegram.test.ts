import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyInitData } from "@/lib/auth/telegram";

/**
 * Мы не можем использовать «боевой» test vector из Telegram docs, потому
 * что у них auth_date уже протух (реализация отбрасывает записи старше 24ч).
 * Поэтому сами подписываем initData свежим auth_date, используя тот же
 * алгоритм что и verifyInitData (HMAC-SHA256 с ключом HMAC("WebAppData", token)).
 */
function signInitData(
  botToken: string,
  fields: Record<string, string>,
): string {
  const entries = Object.entries(fields).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  const params = new URLSearchParams();
  for (const [k, v] of entries) params.set(k, v);
  params.set("hash", hash);
  return params.toString();
}

describe("verifyInitData", () => {
  const BOT_TOKEN = "123456:TEST-Fake-Bot-Token";
  const USER_JSON = JSON.stringify({
    id: 42,
    first_name: "Alice",
    last_name: "Smith",
    username: "alice",
    language_code: "ru",
    is_premium: true,
  });

  it("accepts a valid initData with fresh auth_date", () => {
    const initData = signInitData(BOT_TOKEN, {
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: "AAH123",
      user: USER_JSON,
    });

    const user = verifyInitData(initData, BOT_TOKEN);
    expect(user).not.toBeNull();
    expect(user?.id).toBe(42);
    expect(user?.first_name).toBe("Alice");
    expect(user?.last_name).toBe("Smith");
    expect(user?.username).toBe("alice");
    expect(user?.language_code).toBe("ru");
    expect(user?.is_premium).toBe(true);
  });

  it("rejects initData with tampered field (invalid hash)", () => {
    const initData = signInitData(BOT_TOKEN, {
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: "AAH123",
      user: USER_JSON,
    });
    // Подменяем user после подписи — hash больше не совпадает.
    const params = new URLSearchParams(initData);
    params.set("user", JSON.stringify({ id: 999, first_name: "Mallory" }));
    const tampered = params.toString();

    expect(verifyInitData(tampered, BOT_TOKEN)).toBeNull();
  });

  it("rejects initData signed with a different bot token", () => {
    const initData = signInitData("wrong-token", {
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: USER_JSON,
    });
    expect(verifyInitData(initData, BOT_TOKEN)).toBeNull();
  });

  it("rejects expired auth_date (older than 24h)", () => {
    const dayAgo = Math.floor(Date.now() / 1000) - 25 * 60 * 60;
    const initData = signInitData(BOT_TOKEN, {
      auth_date: String(dayAgo),
      user: USER_JSON,
    });
    expect(verifyInitData(initData, BOT_TOKEN)).toBeNull();
  });

  it("returns null on empty inputs", () => {
    expect(verifyInitData("", BOT_TOKEN)).toBeNull();
    expect(verifyInitData("hash=abc", "")).toBeNull();
  });

  it("returns null when `user` field is missing", () => {
    const initData = signInitData(BOT_TOKEN, {
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: "AAH123",
    });
    expect(verifyInitData(initData, BOT_TOKEN)).toBeNull();
  });
});
