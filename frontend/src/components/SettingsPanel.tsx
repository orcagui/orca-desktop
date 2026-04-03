import { PageHeader, ScrollBody, ConsoleView } from './ui';
import type { FontSettings } from '../types';

// Bundled via @fontsource — available on all platforms without OS dependency
const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
];

const FONT_WEIGHTS: { label: string; value: number }[] = [
  { label: 'Light (300)', value: 300 },
  { label: 'Regular (400)', value: 400 },
  { label: 'Medium (500)', value: 500 },
  { label: 'SemiBold (600)', value: 600 },
];

const SIZE_MIN = 14;
const SIZE_MAX = 30;
const SIZE_STEP = 2;
const FONT_SIZES = Array.from({ length: (SIZE_MAX - SIZE_MIN) / SIZE_STEP + 1 }, (_, i) => SIZE_MIN + i * SIZE_STEP);

interface SettingsPanelProps {
  readonly fontSettings: FontSettings;
  readonly onFontSettingsChange: (next: FontSettings) => void;
}

export default function SettingsPanel({ fontSettings, onFontSettingsChange }: Readonly<SettingsPanelProps>) {
  function handleFamily(value: string) {
    onFontSettingsChange({ ...fontSettings, family: value });
  }

  function handleSize(value: number) {
    onFontSettingsChange({ ...fontSettings, size: value });
  }

  function handleWeight(value: number) {
    onFontSettingsChange({ ...fontSettings, weight: value });
  }

  function handleReset() {
    onFontSettingsChange(defaultFontSettings());
  }

  const selectClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-400';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader eyebrow="Configuration" subtitle="Settings" />

      <ScrollBody>
        <div className="mx-auto max-w-lg space-y-8 px-6 py-6">
          {/* Font section */}
          <section>
            <h2 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Font</h2>
            <div className="space-y-4">
              {/* Font family */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="font-family">
                  Family
                </label>
                <select
                  id="font-family"
                  className={selectClass}
                  value={fontSettings.family}
                  onChange={(e) => { handleFamily(e.target.value); }}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Fonts are bundled with the app — no OS installation required.
                </p>
              </div>

              {/* Font size */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Size</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {fontSettings.size}px
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FONT_SIZES.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input
                        type="radio"
                        name="font-size"
                        value={s}
                        checked={fontSettings.size === s}
                        onChange={() => { handleSize(s); }}
                        className="sr-only"
                      />
                      <span className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                        fontSettings.size === s
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white'
                      }`}>
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Font weight */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="font-weight">
                  Weight
                </label>
                <select
                  id="font-weight"
                  className={selectClass}
                  value={fontSettings.weight}
                  onChange={(e) => { handleWeight(Number(e.target.value)); }}
                >
                  {FONT_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Preview</h2>
            <ConsoleView className="overflow-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div style={{ color: '#34d399', whiteSpace: 'nowrap' }}>$ docker ps --all</div>
              <div style={{ color: '#d1d5db', whiteSpace: 'nowrap', marginTop: '0.25em' }}>CONTAINER ID &nbsp; IMAGE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; STATUS</div>
              <div style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>a1b2c3d4e5f6 &nbsp; nginx:latest &nbsp; Up 2 hours</div>
            </ConsoleView>
          </section>

          {/* Reset */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </ScrollBody>
    </div>
  );
}

export function defaultFontSettings(): FontSettings {
  return {
    family: "'JetBrains Mono', monospace",
    size: 14,
    weight: 400,
  };
}
