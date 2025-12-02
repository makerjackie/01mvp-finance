import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "file.302.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.302.ai",
        pathname: "/**",
      },
      // 添加其他可能的图片CDN域名
      {
        protocol: "https",
        hostname: "generativelanguage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

const withCloudflareDev = async (): Promise<NextConfig> => {
  if (process.env.NODE_ENV === "development") {
    const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
    await setupDevPlatform();
  }
  return baseConfig;
};

export default withCloudflareDev;
