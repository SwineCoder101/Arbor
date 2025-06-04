import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country =
    request.geo?.country ||
    request.headers.get('x-vercel-ip-country') ||
    '';

  if (country === 'GB') {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }

  return NextResponse.next();
}
