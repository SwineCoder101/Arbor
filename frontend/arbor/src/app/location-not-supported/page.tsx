import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Location Not Supported',
  description: 'Our services are not available in your region',
}

export default function LocationNotSupported() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{marginTop: "-100px"}}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Location Not Supported
        </h1>
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-lg mb-4">
          We apologize, but our services are currently not available in your region.
        </p>
        <p className="text-gray-500">
          Our platform is not currently accessible from the United Kingdom.
        </p>
      </div>
    </div>
  )
} 