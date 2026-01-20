import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Solo aplicar en rutas protegidas si es necesario
    // Por ahora verificamos dashboard y transactions
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/transactions')) {

        // En una implementación real usaríamos supabase auth,
        // pero según requisitos v1.0 usaremos una validación simple o la cookie de supabase más adelante.
        // El requisito decía "Validación simple por email".
        // Como no tenemos login form aún, vamos a dejar pasar por ahora 
        // O implementar la lógica de verificar una cookie personalizada si existe.

        // TODO: Implementar lógica de auth real cuando tengamos la pantalla de login.
        // const userEmail = request.cookies.get('user_email')?.value;
        // if (userEmail !== process.env.ALLOWED_EMAIL) {
        //   return NextResponse.redirect(new URL('/login', request.url));
        // }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/transactions/:path*', '/settings/:path*'],
};
