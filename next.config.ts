import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'i5.walmartimages.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'target.scene7.com' },
      { protocol: 'https', hostname: 'pisces.bbystatic.com' },
      { protocol: 'https', hostname: 'img.temu.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      { protocol: 'https', hostname: 'www.costco.com' },
      { protocol: 'https', hostname: 'c1.neweggimages.com' },
      // Shein
      { protocol: 'https', hostname: 'img.ltwebstatic.com' },
    ],
  },
};

export default nextConfig;
