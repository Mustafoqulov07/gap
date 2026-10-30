import type { NextConfig } from "next";

// Backend (NestJS) manzili. Brauzer so'rovlari /api/v1/* orqali shu yerga
// proksi qilinadi — shunda httpOnly cookie'lar frontend domenida saqlanadi
// va CORS muammosi bo'lmaydi.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
