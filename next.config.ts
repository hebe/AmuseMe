import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // OMDB / Amazon poster CDN
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      // Open Library book covers
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      // Google Books thumbnails
      { protocol: 'https', hostname: 'books.google.com' },
    ],
  },
};

export default nextConfig;
