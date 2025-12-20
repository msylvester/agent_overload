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
        "@xenova/transformers": false,
        sharp: false,
        "onnxruntime-node": false,
      };
    }

    // Handle MongoDB optional dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      aws4: false,
      "mongodb-client-encryption": false,
      snappy: false,
      kerberos: false,
      "@mongodb-js/zstd": false,
    };

    return config;
  },
};

export default nextConfig;
