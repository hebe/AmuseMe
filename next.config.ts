import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // OMDB / Amazon poster CDN
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      // Open Library book covers
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
    ],
  },
};

export default nextConfig;
