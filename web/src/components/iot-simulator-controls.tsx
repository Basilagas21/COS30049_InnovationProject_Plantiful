"use client";

import { useEffect, useState } from "react";

const MODE_KEY = "plantiful.iotMode";

type Mode = "simulator" | "hardware";

const SCENARIOS = [
  { value: "normal", label: "Normal sample" },
  { value: "heat", label: "Trigger heat" },
  { value: "critical_heat", label: "Trigger critical heat" },
  { value: "drought", label: "Trigger drought" },
  { value: "severe_drought", label: "Trigger severe drought" },
  { value: "movement", label: "Trigger movement" },
  { value: "rain", label: "Trigger rain" },
  { value: "soil_dry", label: "Trigger dry soil" },
] as const;

export function IotSimulatorControls({
  onTriggered,
}: {
  onTriggered: () => void;
}) {
  const [mode, setMode] = useState<Mode>("simulator");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(MODE_KEY);
      if (saved === "simulator" || saved === "hardware") setMode(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
    setResult(null);
    setError(null);
  }

  async function trigger(scenario: string, label: string) {
    setBusy(scenario);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/iot-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Simulator request failed.");
      }
      setResult(`${label} pushed successfully. Alerts follow the six hour cooldown rule.`);
      onTriggered();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Simulator request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="monitor-panel mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald">Demo controls</p>
          <h2 className="mt-2 text-xl font-semibold">Field feed source</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-moss">
            Switch between simulated readings and the connected IoT kit. Simulator
            buttons push one reading batch when hardware is not attached.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-pine/5 p-1" role="group" aria-label="IoT feed mode">
          <button
            type="button"
            onClick={() => changeMode("simulator")}
            aria-pressed={mode === "simulator"}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              mode === "simulator" ? "bg-white text-emerald shadow-sm" : "text-moss"
            }`}
          >
            Simulator
          </button>
          <button
            type="button"
            onClick={() => changeMode("hardware")}
            aria-pressed={mode === "hardware"}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              mode === "hardware" ? "bg-white text-emerald shadow-sm" : "text-moss"
            }`}
          >
            IoT kit
          </button>
        </div>
      </div>

      {mode === "simulator" ? (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.value}
                type="button"
                disabled={busy !== null}
                onClick={() => trigger(scenario.value, scenario.label)}
                className="min-h-11 rounded-xl border border-pine/15 bg-white px-3 text-sm font-semibold text-pine transition-colors hover:border-emerald hover:bg-sprout disabled:opacity-50"
              >
                {busy === scenario.value ? "Pushing…" : scenario.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-moss">
            Readings are inserted as simulated sensor data and the threat evaluator runs on the next dashboard refresh. Repeated conditions are suppressed by the active cooldown.
          </p>
        </>
      ) : (
        <div className="mt-5 grid gap-3 rounded-2xl border border-pine/10 bg-white p-5 text-sm leading-6 text-moss md:grid-cols-3">
          <div>
            <p className="font-semibold text-pine">1. Connect the kit</p>
            <p>Attach the ESP32 by USB and confirm the serial port is available.</p>
          </div>
          <div>
            <p className="font-semibold text-pine">2. Run the bridge</p>
            <p>Start the local bridge on the connected computer with the configured Supabase key.</p>
          </div>
          <div>
            <p className="font-semibold text-pine">3. Watch freshness</p>
            <p>The dashboard shows live readings when the bridge is sending data.</p>
          </div>
        </div>
      )}

      {result && (
        <p role="status" className="mt-4 rounded-xl bg-sprout px-4 py-3 text-sm font-semibold text-emerald">
          {result}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
