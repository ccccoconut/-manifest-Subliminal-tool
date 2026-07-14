import type { Metadata, Viewport } from "next";
import "./globals.css";
import LiquidBackground from "@/components/ui/LiquidBackground";

export const metadata: Metadata = {
  title: "酥饼 · 用你的声音，生成专属于你的显化sub",
  description: "用你的声音，生成专属于你的显化sub。",
};

export const viewport: Viewport = {
  themeColor: "#eafaf4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="aurora" aria-hidden />
        <LiquidBackground />
        <div className="app-frame">{children}</div>
      </body>
    </html>
  );
}
