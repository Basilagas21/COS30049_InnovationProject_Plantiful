import { readFileSync } from "node:fs";
import path from "node:path";

// MapLibre normally derives its worker URL from `import.meta.url`, which
// Turbopack rewrites to a hashed chunk path where the worker file does not
// exist ("Worker failed to load"). This route serves the real worker bundle
// from node_modules so MapLibre can be pointed at a stable URL instead.
export function GET() {
  try {
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "maplibre-gl",
      "dist",
      "maplibre-gl-worker.mjs"
    );
    const workerSource = readFileSync(workerPath);

    return new Response(workerSource, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response(
      `console.error(${JSON.stringify(String(error))});`,
      { status: 500, headers: { "Content-Type": "text/javascript; charset=utf-8" } }
    );
  }
}
