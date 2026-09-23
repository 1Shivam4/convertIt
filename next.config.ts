import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy server-only packages out of the browser/Edge bundle
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "sharp",
    "ffmpeg-static",
    "pdf-lib",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "pg",
    "@valkey/valkey-glide",
  ],
  allowedDevOrigins: [
    "threefold-expand-unclasp.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.io",
  ],
  webpack(config, { isServer }) {
    if (!isServer) {
      // Tell webpack to ignore node: scheme imports in the client bundle.
      // These come from server-only packages that should never be in client code.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // node: built-ins — mark as false so webpack emits an empty stub
        diagnostics_channel: false,
        async_hooks: false,
        perf_hooks: false,
        stream: false,
        net: false,
        tls: false,
        crypto: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
