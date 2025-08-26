import type {NextConfig} from 'next';

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
      }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://*.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev'
    ]
  }
};

export default nextConfig;
