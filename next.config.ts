import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Prevent @xenova/transformers from being bundled in client-side code
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@xenova/transformers': false,
        'sharp': false,
        'onnxruntime-node': false,
      };
    }
    return config;
  },
};

export default nextConfig;
