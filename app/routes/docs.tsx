import { Link } from "react-flight-router/client";
import { apiGroups } from "../api/docs-schema.ts";
import { ApiDocs } from "./docs.client.tsx";

const Component = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">API Docs</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>API Documentation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          REST API running on port 3001. Used by the iOS companion app for bi-directional sync.
        </p>
      </div>

      <ApiDocs groups={apiGroups} />
    </main>
  );
};

export default Component;
