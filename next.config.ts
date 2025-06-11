import type { NextConfig } from "next";

const nextConfig: NextConfig = {
// Для работы в Docker
  output: 'standalone',
  
  // Базовый путь для админки
  basePath: '/admin',
  
  // Для корректной работы со слэшами
  trailingSlash: true,

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'host.docker.internal',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '**', // Разрешаем все HTTPS домены для изображений
      },
      {
        protocol: 'https',
        hostname: 'labirintdoors.ru',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'bunkerdoors.ru',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'intecron-msk.ru',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'as-doors.ru',
        pathname: '**',
      },

    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Doors Admin',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
};

export default nextConfig;
