import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.shoptet.cz' },
      { protocol: 'https', hostname: '*.qsport.cz' },
      { protocol: 'https', hostname: 'cdn.myshoptet.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
