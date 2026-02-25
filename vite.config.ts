import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { flightRouter } from "react-flight-router/dev";

// Serve /api requests via the Hono API app in dev mode (no proxy needed)
function apiDevPlugin(): Plugin {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) return next();

        // Lazy-load the API app so it picks up file changes via Vite's module graph
        const mod = await server.ssrLoadModule("./app/api/server.ts");
        const apiApp = mod.app;

        // Build a fetch-compatible Request from the Node.js IncomingMessage
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost";
        const url = new URL(req.url, `${protocol}://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        }

        const hasBody = req.method !== "GET" && req.method !== "HEAD";
        const body = hasBody
          ? await new Promise<Uint8Array>((resolve) => {
              const chunks: Uint8Array[] = [];
              req.on("data", (c: Uint8Array) => chunks.push(c));
              req.on("end", () => {
                const buf = Buffer.concat(chunks);
                resolve(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
              });
            })
          : undefined;

        const request = new Request(url.toString(), {
          method: req.method,
          headers,
          body: body as BodyInit | undefined,
        });

        const response = await apiApp.fetch(request);

        res.statusCode = response.status;
        response.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });

        const arrayBuffer = await response.arrayBuffer();
        res.end(Buffer.from(arrayBuffer));
      });
    },
  };
}

export default defineConfig({
  clearScreen: false,
  plugins: [
    tailwindcss(),
    react(),
    flightRouter({ routesFile: "./app/routes.ts" }),
    apiDevPlugin(),
  ],
  server: {
    host: true,
    port: 3000,
    fs: {
      allow: ["..", "./data"],
    },
    allowedHosts: ["*"],
  },
}) as any;
