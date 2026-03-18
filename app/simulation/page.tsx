"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SimulationCanvas from "@/components/SimulationCanvas";
import type { DesignParams, SimOutput } from "@/lib/types";

interface SimulationPageProps {
  searchParams: Promise<{
    nose?: string;
    ratio?: string;
    sweep?: string;
    tail?: string;
    volume?: string;
  }>;
}

export default function SimulationPage({ searchParams }: SimulationPageProps) {
  const sp = use(searchParams);
  const router = useRouter();

  const params: DesignParams = {
    noseAngle: parseFloat(sp.nose ?? "0.5"),
    fuselageRatio: parseFloat(sp.ratio ?? "7"),
    wingSweep: parseFloat(sp.sweep ?? "35"),
    tailTaper: parseFloat(sp.tail ?? "0.5"),
    volumeDistribution: parseFloat(sp.volume ?? "0"),
  };

  const [serverResult, setServerResult] = useState<SimOutput | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isNewBest, setIsNewBest] = useState(false);
  const submitted = useRef(false);

  // Submit to server once the page loads (not waiting for animation)
  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setSubmitError(data.error);
        } else {
          setServerResult(data.result);
          setIsNewBest(data.isNewBest ?? false);
          setSubmitDone(true);
        }
      })
      .catch(() => setSubmitError("Failed to save score"))
      .finally(() => setSubmitting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use server result if available, otherwise use client-calculated
  // (client-side calculation for the animation display)
  const displayResult: SimOutput = serverResult ?? { pldb: 0, overpressure: 0 };
  const showCanvas = serverResult !== null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Simulation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Watch your aircraft create a sonic boom at Mach 1.5
          </p>
        </div>
        <Link
          href="/designer"
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back to Designer
        </Link>
      </div>

      {submitting && !serverResult && (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <div>Computing sonic boom physics…</div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4">
          {submitError === "Unauthorized"
            ? "You need to be logged in to save scores."
            : submitError}
        </div>
      )}

      {showCanvas && (
        <SimulationCanvas
          pldb={displayResult.pldb}
          overpressure={displayResult.overpressure}
        />
      )}

      {submitDone && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {isNewBest && (
            <div className="bg-sky-900/40 border border-sky-700 text-sky-300 rounded-lg px-4 py-2 text-sm font-medium">
              🏆 New personal best!
            </div>
          )}
          <Link
            href="/leaderboard"
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            View Leaderboard
          </Link>
          <Link
            href="/designer"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Redesign Aircraft
          </Link>
        </div>
      )}

      {/* Design summary */}
      <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
          Design Parameters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          {[
            { label: "Nose", value: params.noseAngle.toFixed(2) },
            { label: "Fineness", value: `${params.fuselageRatio.toFixed(1)}:1` },
            { label: "Sweep", value: `${params.wingSweep.toFixed(0)}°` },
            { label: "Tail", value: params.tailTaper.toFixed(2) },
            { label: "Volume", value: params.volumeDistribution.toFixed(2) },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs">{item.label}</div>
              <div className="text-white font-mono font-bold mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
