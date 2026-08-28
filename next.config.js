/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage public bucket for post images/avatars.
        // Replace <project-ref> with your Supabase project ref, or set via env.
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
