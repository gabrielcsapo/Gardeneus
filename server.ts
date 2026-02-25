import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createServer } from "react-flight-router/server";
import { app as apiApp } from "./app/api/server.ts";

async function main() {
  const flightApp = await createServer({
    buildDir: "./dist",
  });

  // Create a parent app so API routes are registered before the RSC catch-all
  const app = new Hono();

  // API routes (must come before the flight router catch-all)
  app.route("/", apiApp);

  // Public static files (favicon, manifest, icons)
  app.use("/*", serveStatic({ root: "./public" }));

  // Flight router handles RSC, SSR, assets, and server actions
  app.route("/", flightApp);

  const port = Number(process.env.PORT) || 3000;
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Backyard Garden running at http://localhost:${info.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err.stack || err);
  process.exit(1);
});
