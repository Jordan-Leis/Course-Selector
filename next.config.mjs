/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent static generation of pages that use Supabase
  experimental: {
    // This ensures dynamic rendering for pages that need it
  },
};

export default nextConfig;
