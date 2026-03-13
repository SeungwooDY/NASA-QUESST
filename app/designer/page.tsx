"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AircraftSVG from "@/components/AircraftSVG";
import DesignerSliders from "@/components/DesignerSliders";
import { calculateSonicBoom } from "@/lib/physics";
import type { DesignParams } from "@/lib/types";

function DesignerContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [params, setParams] = useState<DesignParams>({
    noseAngle: parseFloat(sp.get("nose") ?? "0.5"),
    fuselageRatio: parseFloat(sp.get("ratio") ?? "7"),
    wingSweep: parseFloat(sp.get("sweep") ?? "35"),
    tailTaper: parseFloat(sp.get("tail") ?? "0.5"),
    volumeDistribution: parseFloat(sp.get("volume") ?? "0"),
  });

  const { pldb } = calculateSonicBoom(params);

  function handleRunSimulation() {
    const query = new URLSearchParams({
      nose: params.noseAngle.toString(),
      ratio: params.fuselageRatio.toString(),
      sweep: params.wingSweep.toString(),
      tail: params.tailTaper.toString(),
      volume: params.volumeDistribution.toString(),
    });
    router.push(`/simulation?${query}`);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Aircraft Designer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Adjust the parameters below to design your supersonic aircraft. Lower PLdB = quieter boom!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: SVG preview */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-slate-300 uppercase tracking-wider">
            Live Preview
          </div>
          <AircraftSVG params={params} />
          <div className="text-xs text-slate-500 text-center">
            Aircraft shape updates in real-time as you move the sliders
          </div>
        </div>

        {/* Right: Sliders */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-4">
            Design Parameters
          </div>
          <DesignerSliders params={params} onChange={setParams} pldb={pldb} />
        </div>
      </div>

      {/* Run Simulation button */}
      <div className="flex justify-center">
        <button
          onClick={handleRunSimulation}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg hover:shadow-sky-500/20"
        >
          Run Simulation →
        </button>
      </div>

      <div className="mt-4 text-center text-slate-500 text-xs">
        The simulation runs server-side to compute your official score
      </div>
    </main>
  );
}

export default function DesignerPage() {
  return (
    <Suspense>
      <DesignerContent />
    </Suspense>
  );
}
