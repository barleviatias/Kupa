import { NextResponse } from 'next/server';

export function proxy(request) {
  // YouTube rejects the numeric loopback origin with error 150.
  // Use the actual localhost origin in development; never spoof the player origin.
  // NextURL normalizes loopback names, so inspect the actual Host header.
  const hostname = (request.headers.get('host') || '').split(':')[0];
  if (process.env.NODE_ENV === 'development' && hostname === '127.0.0.1') {
    const url = request.nextUrl.clone();
    url.hostname = 'localhost';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: '/' };
