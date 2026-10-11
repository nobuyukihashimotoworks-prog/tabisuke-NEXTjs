import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // フルカレンダーのクラスコンポーネントが正しくインスタンス化されるようにトランスパイル対象に追加
  transpilePackages: [
    "@fullcalendar/common",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/interaction",
    "@fullcalendar/core",
  ],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
