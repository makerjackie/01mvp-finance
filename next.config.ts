import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  output: "standalone",
};

const withCloudflareDev = async (): Promise<NextConfig> => {
  if (process.env.NODE_ENV === "development") {
    const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
    await setupDevPlatform();
  }
  return baseConfig;
};

export default withCloudflareDev;
