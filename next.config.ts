import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Storage 등 외부 이미지 호스트를 쓰게 되면 여기에 remotePatterns 추가.
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
