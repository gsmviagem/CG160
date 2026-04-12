import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@cg160/types',
    '@cg160/db',
    '@cg160/scoring',
    '@cg160/ai',
    '@cg160/learning',
  ],
  experimental: {
    // Required for Inngest streaming
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
