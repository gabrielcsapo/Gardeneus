import { Link } from "react-flight-router/client";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 text-center">
      <h1 className="text-6xl font-bold text-garden-600 dark:text-garden-400 mb-4">404</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Page not found. The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
