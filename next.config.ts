import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 开发服务与生产构建使用不同目录，避免两者同时运行时互相覆盖 chunk。
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // 仓库位于一个含多个 lockfile 的父目录下，显式指定根目录以消除告警
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
