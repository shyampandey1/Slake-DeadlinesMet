import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is the corrected section.
    // We create a new watchOptions object instead of modifying the existing one.
    config.watchOptions = {
      ...config.watchOptions, // Keep all existing options
      ignored: [
        ...(Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : []),
        '**/tsconfig.json',
      ],
    };
    
    return config;
  },
};

export default nextConfig;
