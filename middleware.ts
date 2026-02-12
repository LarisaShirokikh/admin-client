import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token')?.value;

    const publicPaths = ['/login'];

    if (publicPaths.includes(pathname)) {
        if (accessToken) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = accessToken ? '/dashboard' : '/login';
        return NextResponse.redirect(url);
    }

    if (!accessToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};