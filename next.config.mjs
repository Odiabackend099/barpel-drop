/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
