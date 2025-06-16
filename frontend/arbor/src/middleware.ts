import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { IPinfoWrapper } from 'node-ipinfo'

// Initialize IPinfo with your token
const ipinfoWrapper = new IPinfoWrapper(process.env.IPINFO_KEY || '')

export async function middleware(request: NextRequest) {
//   try {
//     const countryCodeCookie = request.cookies.get('countryCode');
//     const userIpCookie = request.cookies.get('userIP'); // Get the user IP cookie
//
//     let countryCode: string | undefined = countryCodeCookie?.value;
//     const storedUserIp: string | undefined = userIpCookie?.value;
//
//     // Get the current IP from request headers
//     const currentIp = request.headers.get('x-real-ip') || 
//                       request.headers.get('x-forwarded-for')?.split(',')[0] ||
//                       request.headers.get('x-client-ip');
//     
//     let shouldFetchIpInfo = false;
//
//     // Check if countryCode or userIP cookies are missing, or if IP has changed
//     if (!countryCode || !storedUserIp || currentIp !== storedUserIp) {
//       shouldFetchIpInfo = true;
//     }
//
//     if (shouldFetchIpInfo) {
//       console.log('Detected IP:', currentIp);
//
//       // Handle localhost IP for development
//       if (currentIp === '::1' || currentIp === '127.0.0.1') {
//         countryCode = 'US'; // Default to a non-UK country for localhost
//         console.log('Localhost detected, setting countryCode to:', countryCode);
//       } else if (!currentIp) {
//         console.log('No IP address found in request. Allowing access.');
//         // If no IP, we can't determine location, so allow access by returning next.
//         // We will not set countryCode or userIP cookies in this case.
//         return NextResponse.next(); 
//       } else {
//         // Look up the IP information
//         const ipInfo = await ipinfoWrapper.lookupIp(currentIp);
//         console.log('ipInfo', ipInfo);
//         countryCode = ipInfo.countryCode;
//         console.log('countryCode', countryCode);
//       }
//     }
//     // else, if shouldFetchIpInfo is false, countryCode will retain its value from countryCodeCookie
//
//     // Determine the response based on countryCode
//     const response = countryCode === 'GB' 
//       ? NextResponse.redirect(new URL('/location-not-supported', request.url))
//       : NextResponse.next();
//     
//     // If IP info was fetched or updated, set/update cookies in the response
//     if (shouldFetchIpInfo) {
//         if (countryCode) { // Ensure countryCode is defined before setting
//             response.cookies.set('countryCode', countryCode, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // Store for 7 days
//         }
//         if (currentIp) { // Ensure currentIp is defined before setting
//             response.cookies.set('userIP', currentIp, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // Store for 7 days
//         }
//     }
//     
//     return response;
//
//   } catch (error) {
//     // Log the error but allow access (fail open)
//     console.error('Error checking IP location:', error)
//     return NextResponse.next()
//   }
// }
//
// // Configure middleware to run on all pages except certain static files and API routes
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - location-not-supported (to prevent redirect loop)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico|location-not-supported|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.svg).*)',
//   ],
} 
