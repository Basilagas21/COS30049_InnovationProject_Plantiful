import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { isOfficer } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const runFile = promisify(execFile);

const SCENARIOS = [
  "normal",
  "heat",
  "critical_heat",
  "drought",
  "severe_drought",
  "movement",
  "rain",
  "soil_dry",
] as const;

type Scenario = (typeof SCENARIOS)[number];

function isScenario(value: unknown): value is Scenario {
  return typeof value === "string" && (SCENARIOS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  if (!(await isOfficer())) {
    return Response.json({ error: "Officer access required." }, { status: 403 });
  }

  let body: { scenario?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isScenario(body.scenario)) {
    return Response.json({ error: "Unknown simulator scenario." }, { status: 400 });
  }

  const root = path.resolve(process.cwd(), "..");
  const python = process.env.PYTHON || "python";

  try {
    const { stdout, stderr } = await runFile(
      python,
      ["iot/publisher.py", "--once", "--scenario", body.scenario],
      {
        cwd: root,
        timeout: 45_000,
        maxBuffer: 1024 * 512,
      },
    );
    return Response.json({
      ok: true,
      scenario: body.scenario,
      output: (stdout || stderr).trim().slice(-1200),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The simulator could not be started.";
    return Response.json(
      { ok: false, error: message.slice(0, 500) },
      { status: 500 },
    );
  }
}
