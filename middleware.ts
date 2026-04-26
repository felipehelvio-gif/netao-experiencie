import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protege /admin/* (exceto /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protege /api/admin/* (exceto login)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ erro: 'não autenticado' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
