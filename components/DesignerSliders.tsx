"use client";

import type { DesignParams } from "@/lib/types";

interface SliderConfig {
  key: keyof DesignParams;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: "noseAngle",
    label: "Nose Shape",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "Optimal ~0.2 (Von Kármán ogive). Too sharp: structural tip rounds it out. Too blunt: strong bow shock.",
    format: (v) => v < 0.15 ? "Needle (too sharp)" : v < 0.3 ? "Optimal" : v < 0.6 ? "Rounded" : "Blunt",
  },
  {
    key: "fuselageRatio",
    label: "Fuselage Fineness Ratio",
    min: 3,
    max: 12,
    step: 0.1,
    hint: "Optimal ~10–11:1. Above 11, structural weight cancels boom gains. Lower = fatter = louder.",
    format: (v) => `${v.toFixed(1)}:1`,
  },
  {
    key: "wingSweep",
    label: "Wing Sweep Angle",
    min: 0,
    max: 75,
    step: 1,
    hint: "Optimal ~50–55° for Mach 1.6. Below ~39°: subsonic leading edge shock. Above 60°: over-swept delta.",
    format: (v) => `${v.toFixed(0)}°`,
  },
  {
    key: "tailTaper",
    label: "Tail Taper",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "Optimal ~0.5 (Sears-Haack equivalent). Too sharp: structurally fragile. Too flat: strong tail shock.",
    format: (v) => v < 0.2 ? "Flat cut" : v < 0.4 ? "Slight taper" : v < 0.6 ? "Optimal" : v < 0.8 ? "Sharp taper" : "Needle tail",
  },
  {
    key: "volumeDistribution",
    label: "Volume Distribution",
    min: -1,
    max: 1,
    step: 0.01,
    hint: "Optimal ~−0.2 (slightly rear-heavy, per Sears-Haack theory). Front-heavy significantly increases boom.",
    format: (v) => v < -0.4 ? "Rear heavy" : v < -0.1 ? "Optimal" : v < 0.1 ? "Uniform" : v < 0.5 ? "Fwd-biased" : "Front heavy",
  },
];

interface DesignerSlidersProps {
  params: DesignParams;
  onChange: (params: DesignParams) => void;
  pldb: number;
  overpressure: number;
}

function structuralRisk(overpressure: number): { label: string; color: string } {
  if (overpressure < 10)  return { label: "Negligible",          color: "text-green-400" };
  if (overpressure < 50)  return { label: "Windows rattle",      color: "text-green-300" };
  if (overpressure < 150) return { label: "Glass breakage likely", color: "text-yellow-400" };
  if (overpressure < 500) return { label: "Structural damage risk", color: "text-orange-400" };
  return                         { label: "Severe structural risk", color: "text-red-400" };
}

export default function DesignerSliders({ params, onChange, pldb, overpressure }: DesignerSlidersProps) {
  function handleChange(key: keyof DesignParams, value: number) {
    onChange({ ...params, [key]: value });
  }

  const pldbColor =
    pldb < 80
      ? "text-green-400"
      : pldb < 97
      ? "text-yellow-400"
      : "text-red-400";

  const grade =
    pldb < 77
      ? "Excellent!"
      : pldb < 83
      ? "Good"
      : pldb < 93
      ? "Average"
      : pldb < 107
      ? "Loud"
      : "Very Loud!";

  const risk = structuralRisk(overpressure);

  return (
    <div className="flex flex-col gap-5">
      {SLIDERS.map((slider) => {
        const value = params[slider.key];
        const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;

        return (
          <div key={slider.key} className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-slate-200">
                {slider.label}
              </label>
              <span className="text-sm font-mono text-sky-400">
                {slider.format(value)}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={(e) => handleChange(slider.key, parseFloat(e.target.value))}
              className="w-full h-2 rounded appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #38bdf8 ${pct}%, #334155 ${pct}%)`,
              }}
            />
            <p className="text-xs text-slate-400">{slider.hint}</p>
          </div>
        );
      })}

      {/* Live PLdB readout */}
      <div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Live Sonic Boom Level
          </div>
          <div className={`text-3xl font-bold font-mono ${pldbColor}`}>
            {pldb.toFixed(1)} <span className="text-lg">PLdB</span>
          </div>
          <div className={`text-sm mt-1 ${pldbColor}`}>{grade}</div>
          <div className="text-xs text-slate-500 mt-1">
            Lower is better · Best possible ≈ 75 PLdB
          </div>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Ground Overpressure
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-200">
              {overpressure.toFixed(1)} Pa
            </span>
            <span className={`text-sm font-medium ${risk.color}`}>
              — {risk.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
