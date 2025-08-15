
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
  // This is the correct placement for the allowedDevOrigins key
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // This is a simplified version for common cloud IDEs.
  // In a real production scenario, you might want to be more specific.
  rewrites: async () => {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ];
  },
};

const originalNextConfig = nextConfig;

const newNextConfig: NextConfig = {
  ...originalNextConfig,
  // This is the correct placement for the allowedDevOrigins key
  // This will allow requests from any cloud workstation dev URL
  allowedDevOrigins: ["*.cloudworkstations.dev"],
}


export default newNextConfig;
