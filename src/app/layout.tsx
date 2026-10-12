import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabisuke - 旅行日程プランナー",
  description: "あなたの旅行計画をサポートするアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
