const TILE_BASE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile";

type Context = { params: Promise<{ path: string[] }> };

export const runtime = "nodejs";

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

export async function GET(_request: Request, { params }: Context) {
  const { path } = await params;
  if (path.length !== 3 || !path.every(isNumeric)) {
    return new Response("Invalid tile", { status: 400 });
  }

  const [z, y, x] = path.map(Number);
  const max = 2 ** z;
  if (z < 0 || z > 19 || y < 0 || x < 0 || y >= max || x >= max) {
    return new Response("Invalid tile", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const upstream = await fetch(`${TILE_BASE}/${z}/${y}/${x}`, {
      headers: { Accept: "image/png" },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      return new Response("Tile unavailable", { status: 502 });
    }
    const bytes = await upstream.arrayBuffer();
    return new Response(bytes, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch {
    return new Response("Tile unavailable", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
