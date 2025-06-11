// middleware.ts (в корне проекта, рядом с package.json)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Получаем токен из cookies
    const accessToken = request.cookies.get('access_token')?.value;

    // Публичные маршруты (доступны без авторизации)
    const publicPaths = ['/login'];

    // Если это публичный маршрут - пропускаем
    if (publicPaths.includes(pathname)) {
        // Если авторизован и пытается зайти на логин - редирект на дашборд
        if (accessToken) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Если это корневой путь - редирект
    if (pathname === '/') {
        if (accessToken) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Для всех остальных маршрутов проверяем авторизацию
    if (!accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Применяем middleware ко всем маршрутам кроме:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};