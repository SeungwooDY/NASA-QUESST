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
    hint: "0 = sharp needle nose (quiet), 1 = blunt rounded nose (loud)",
    format: (v) => v === 0 ? "Sharp" : v === 1 ? "Blunt" : v < 0.4 ? "Pointed" : v < 0.7 ? "Rounded" : "Very blunt",
  },
  {
    key: "fuselageRatio",
    label: "Fuselage Fineness Ratio",
    min: 3,
    max: 12,
    step: 0.1,
    hint: "Higher = longer & thinner body (quieter). Lower = short & fat (louder)",
    format: (v) => `${v.toFixed(1)}:1`,
  },
  {
    key: "wingSweep",
    label: "Wing Sweep Angle",
    min: 0,
    max: 75,
    step: 1,
    hint: "More sweep angle reduces boom. Like the SR-71 Blackbird!",
    format: (v) => `${v.toFixed(0)}°`,
  },
  {
    key: "tailTaper",
    label: "Tail Taper",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "0 = flat cut (loud), 1 = sharp pointed tail (quieter)",
    format: (v) => v === 0 ? "Flat cut" : v === 1 ? "Needle tail" : v < 0.4 ? "Slight taper" : v < 0.7 ? "Tapered" : "Sharp tail",
  },
  {
    key: "volumeDistribution",
    label: "Volume Distribution",
    min: -1,
    max: 1,
    step: 0.01,
    hint: "-1 = rear-heavy, 0 = uniform, +1 = front-heavy. Uniform is quietest!",
    format: (v) => v < -0.5 ? "Rear heavy" : v > 0.5 ? "Front heavy" : "Uniform",
  },
];

interface DesignerSlidersProps {
  params: DesignParams;
  onChange: (params: DesignParams) => void;
  pldb: number;
}

export default function DesignerSliders({ params, onChange, pldb }: DesignerSlidersProps) {
  function handleChange(key: keyof DesignParams, value: number) {
    onChange({ ...params, [key]: value });
  }

  const pldbColor =
    pldb < 110
      ? "text-green-400"
      : pldb < 120
      ? "text-yellow-400"
      : "text-red-400";

  const grade =
    pldb < 108
      ? "Excellent!"
      : pldb < 113
      ? "Good"
      : pldb < 118
      ? "Average"
      : pldb < 125
      ? "Loud"
      : "Very Loud!";

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
      <div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
          Live Sonic Boom Level
        </div>
        <div className={`text-3xl font-bold font-mono ${pldbColor}`}>
          {pldb.toFixed(1)} <span className="text-lg">PLdB</span>
        </div>
        <div className={`text-sm mt-1 ${pldbColor}`}>{grade}</div>
        <div className="text-xs text-slate-500 mt-1">
          Lower is better · Best possible ≈ 103 PLdB
        </div>
      </div>
    </div>
  );
}
