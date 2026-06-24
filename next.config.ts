import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 仓库位于一个含多个 lockfile 的父目录下，显式指定根目录以消除告警
  outputFileTracingRoot: __dirname,
  // msedge-tts 依赖 ws（含 bufferutil 原生插件），交由 Node 运行时加载，避免被打包破坏
  serverExternalPackages: ["msedge-tts", "ws"],
};

export default nextConfig;
