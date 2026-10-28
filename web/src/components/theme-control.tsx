"use client";

import { useTheme, type Theme } from "@/lib/theme-provider";

const options: { value: Theme; label: string; hint: string }[] = [
  { value: "system", label: "System", hint: "Follow this device" },
  { value: "light", label: "Light", hint: "Cream and pine" },
  { value: "dark", label: "Dark", hint: "Low light" },
];

export function ThemeControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <p className="text-sm font-semibold text-pine">Appearance</p>
      <p className="mt-0.5 text-sm text-moss">
        Choose a light or dark theme, or follow this device.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Appearance">
        {options.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={active}
              className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-emerald bg-sprout text-emerald"
                  : "border-pine/10 bg-cream text-moss hover:border-emerald hover:text-pine"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-xs">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
