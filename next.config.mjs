/** @type {import('next').NextConfig} */
const nextConfig = {
  // FullCalendarのコンポーネントが正しく動作するようにトランスパイル対象に指定
  transpilePackages: [
    "@fullcalendar/common",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/interaction",
    "@fullcalendar/core",
  ],
};

export default nextConfig;
