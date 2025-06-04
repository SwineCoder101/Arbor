import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = (request as unknown as { geo: { country: string } }).geo?.country || '';

  if (country === 'GB') {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }

  return NextResponse.next();
}
