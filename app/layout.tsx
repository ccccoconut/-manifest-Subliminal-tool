import type { Metadata, Viewport } from "next";
import "./globals.css";
import SciFiBackground from "@/components/ui/SciFiBackground";

export const metadata: Metadata = {
  title: "心声调频 InnerTune · 用自己的声音，生成把自己带回来的音乐",
  description:
    "AI 个性化自我对话声景工具：描述当下状态，AI 理解情绪并生成第一人称肯定语，用你自己的声音录下核心心声，结合声景配方混成专属情绪陪伴音频，并记录聆听前后的情绪变化。",
};

export const viewport: Viewport = {
  themeColor: "#0a0a14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <SciFiBackground />
        {children}
      </body>
    </html>
  );
}
