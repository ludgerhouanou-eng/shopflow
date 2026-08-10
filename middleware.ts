import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Protection des routes privées du tableau de bord
  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/products') ||
    path.startsWith('/orders') ||
    path.startsWith('/settings') ||
    path.startsWith('/stock') ||
    path.startsWith('/customers') ||
    path.startsWith('/payments') ||
    path.startsWith('/reports') ||
    path.startsWith('/subscriptions');

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  if (isProtectedRoute && !user) {
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/stock/:path*',
    '/customers/:path*',
    '/payments/:path*',
    '/reports/:path*',
    '/subscriptions/:path*',
    '/login',
    '/register',
  ],
};
