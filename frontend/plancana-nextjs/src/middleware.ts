import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const PROTECTED_ROUTES = {
  '/processor/process': ['PROCESSOR'],
  '/distributor/receive': ['DISTRIBUTOR'],
  '/distributor/distribute': ['DISTRIBUTOR'],
  '/retailer/receive': ['RETAILER'],
  '/retailer/price': ['RETAILER'],
  '/process-batch': [], // Requires authentication, any role
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route needs protection
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route =>
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Not authenticated - redirect to login with returnUrl
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If route requires specific roles, verify from token (basic check)
  // Note: Full validation happens on the backend
  const requiredRoles = PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES];

  if (requiredRoles && requiredRoles.length > 0) {
    try {
      // Decode JWT to check role (basic check, not cryptographically verified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || payload.user?.role;

      if (!requiredRoles.includes(userRole)) {
        // Wrong role - redirect to unauthorized page or dashboard
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    } catch (error) {
      // Invalid token - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    '/processor/:path*',
    '/distributor/:path*',
    '/retailer/:path*',
    '/process-batch/:path*',
  ],
};
