
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
        hostname: 'femgftishdtzacfimkpw.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Allow requests from the development environment's origin
  experimental: {
    // This property is now at the top level, so we leave experimental empty
    // or remove it if not needed for other features.
  },
  allowedDevOrigins: ["*.cloudworkstations.dev"],
};

export default nextConfig;
