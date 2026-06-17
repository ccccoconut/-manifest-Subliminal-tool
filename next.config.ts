import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 仓库位于一个含多个 lockfile 的父目录下，显式指定根目录以消除告警
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
