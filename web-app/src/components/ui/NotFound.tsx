export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  )
}
