"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RunHistory } from "@/lib/types";

function pldbColor(pldb: number): string {
  if (pldb < 125) return "text-green-400";
  if (pldb < 135) return "text-yellow-400";
  return "text-red-400";
}

export default function HistoryPage() {
  const [history, setHistory] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Run History</h1>
          <p className="text-slate-400 text-sm mt-1">
            All your past simulations — click Load to reload any design into the designer.
          </p>
        </div>
        <Link
          href="/designer"
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          New Design
        </Link>
      </div>

      {loading && (
        <div className="text-center text-slate-400 py-12">Loading your runs…</div>
      )}

      {!loading && history.length === 0 && (
        <div className="text-center text-slate-400 py-12">
          No runs yet.{" "}
          <Link href="/designer" className="text-sky-400 hover:text-sky-300">
            Design your first aircraft!
          </Link>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">PLdB</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">ΔP (Pa)</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Nose</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Ratio</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Sweep°</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Tail</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Volume</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((run) => {
                const loadHref = `/designer?nose=${run.design.noseAngle}&ratio=${run.design.fuselageRatio}&sweep=${run.design.wingSweep}&tail=${run.design.tailTaper}&volume=${run.design.volumeDistribution}`;
                return (
                  <tr
                    key={run.id}
                    className="border-t border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(run.runAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold ${pldbColor(run.pldb)}`}>
                      {run.pldb.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 hidden sm:table-cell">
                      {run.overpressure.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {run.design.noseAngle.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {run.design.fuselageRatio.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {run.design.wingSweep.toFixed(0)}°
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {run.design.tailTaper.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {run.design.volumeDistribution.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={loadHref}
                        className="text-sky-400 hover:text-sky-300 text-xs font-medium whitespace-nowrap"
                      >
                        Load →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
