import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Revision для precache — приоритет: переменная окружения BUILD_REVISION
// (передаётся через Docker build arg), затем git HEAD (меняется при каждом
// коммите), затем случайный UUID. Hardcoded "v1" приводит к stale precache:
// после rebuild'а HTML /offline ссылается на новые чанки, а старый SW
// отдаёт старый HTML.
const revision =
  process.env.BUILD_REVISION ||
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output для минимального Docker image: .next/standalone содержит
  // server.js и только необходимые файлы из node_modules. Не влияет на dev/start
  // локально, только на финальный артефакт next build.
  output: "standalone",
  experimental: {
    typedRoutes: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  // Нативные модули с .node бинарниками: standalone трассировщик не всегда
  // вытягивает их автоматически, поэтому включаем руками для всех роутов.
  // bindings/file-uri-to-path — транзитивные зависимости better-sqlite3,
  // загружаются динамически и не попадают в автоматический trace; должны
  // быть захожены через .npmrc public-hoist-pattern.
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/better-sqlite3/**/*",
      "node_modules/bindings/**/*",
      "node_modules/file-uri-to-path/**/*",
      "node_modules/sharp/**/*",
      "node_modules/@node-rs/argon2/**/*",
      "node_modules/@node-rs/argon2-*/**/*",
    ],
  },
  async rewrites() {
    return [
      // Заглушка для старых PWA-клиентов: serwist в dev отключён, но
      // ранее установленный SW может стучаться в /dev-sw.js. Отдаём
      // самораспаковывающийся stub через api route (Next.js не любит
      // точку в имени сегмента, поэтому используем rewrite).
      { source: "/dev-sw.js", destination: "/api/dev-sw" },
    ];
  },
};

export default withSerwist(nextConfig);
