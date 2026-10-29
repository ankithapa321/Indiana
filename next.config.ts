import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/sweater", destination: "/sweatshirt", permanent: true },
      { source: "/tshirts", destination: "/tshirt", permanent: true },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-api.printify.com",
      },
      {
        protocol: "https",
        hostname: "images.printify.com",
      },
    ],
  },
};

export default nextConfig;