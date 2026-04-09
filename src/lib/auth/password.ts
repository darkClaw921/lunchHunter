import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing helpers — argon2id via @node-rs/argon2.
 *
 * Параметры подобраны согласно OWASP-рекомендациям для argon2id:
 * memoryCost ~19MiB, timeCost 2, parallelism 1. Достаточно быстро для
 * серверных запросов (<100мс) и безопасно для хранения паролей.
 */
const OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(
  hashString: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(hashString, plain, OPTIONS);
  } catch {
    return false;
  }
}
