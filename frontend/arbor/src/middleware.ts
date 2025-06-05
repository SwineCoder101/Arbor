import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { IPinfoWrapper } from 'node-ipinfo'

// Initialize IPinfo with your token
const ipinfoWrapper = new IPinfoWrapper(process.env.IPINFO_KEY || '')

export async function middleware(request: NextRequest) {
  try {
    const countryCodeCookie = request.cookies.get('countryCode');

    let countryCode = countryCodeCookie?.value;

    if (!countryCode) {
      // Get the IP from request headers
      const ip = request.headers.get('x-real-ip') || 
                request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-client-ip')
      
      console.log('Detected IP:', ip)

      // Handle localhost IP for development
      if (ip === '::1' || ip === '127.0.0.1') {
        countryCode = 'US'; // Default to a non-UK country for localhost
        console.log('Localhost detected, setting countryCode to:', countryCode);
      } else if (!ip) {
        console.log('No IP address found in request')
        return NextResponse.next()
      } else {
        // Look up the IP information
        const ipInfo = await ipinfoWrapper.lookupIp(ip)
        console.log('ipInfo', ipInfo)
        countryCode = ipInfo.countryCode;
        console.log('countryCode', countryCode)
      }
    } else {
    }

    // Check if the IP is from the UK (country code 'GB')
    if (countryCode === 'GB') {
      // Redirect to the "not supported" page
      const response = NextResponse.redirect(new URL('/location-not-supported', request.url))
      if (!countryCodeCookie || countryCodeCookie.value === '') {
        response.cookies.set('countryCode', countryCode, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // Store for 7 days
      }
      return response;
    }

    // Allow access for non-UK IPs
    const response = NextResponse.next()
    if (!countryCodeCookie || countryCodeCookie.value === '') {
      response.cookies.set('countryCode', countryCode, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // Store for 7 days
    }
    return response;
  } catch (error) {
    // Log the error but allow access (fail open)
    console.error('Error checking IP location:', error)
    return NextResponse.next()
  }
}

// Configure middleware to run on all pages except certain static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - location-not-supported (to prevent redirect loop)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|location-not-supported|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.svg).*)',
  ],
} 