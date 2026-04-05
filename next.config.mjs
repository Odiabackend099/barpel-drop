import bundleAnalyzer from '@next/bundle-analyzer';
import withPWA from '@ducanh2912/next-pwa';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async redirects() {
    return [
      {
        source: '/try',
        destination: '/try.html',
        permanent: false,
      },
    ];
  },
};

export default withBundleAnalyzer(
  withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    reloadOnOnline: true,
    cacheOnFrontEndNav: true,
    workboxOptions: { disableDevLogs: true },
  })(nextConfig)
);
