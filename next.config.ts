import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/offline", revision: "v1" }],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  serverExternalPackages: ["better-sqlite3"],
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
