"use client";

import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function pldbColor(pldb: number): string {
  if (pldb < 125) return "text-green-400";
  if (pldb < 135) return "text-yellow-400";
  return "text-red-400";
}

function pldbBg(pldb: number): string {
  if (pldb < 125) return "bg-green-900/30";
  if (pldb < 135) return "bg-yellow-900/30";
  return "bg-red-900/20";
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        No scores yet. Be the first to run a simulation!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-slate-400 text-left">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Pilot</th>
            <th className="px-4 py-3 font-medium">PLdB</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">ΔP (Pa)</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Nose</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Ratio</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Sweep°</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">Tail</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">Volume</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.rank}
              className={`border-t border-slate-700/50 transition-colors ${
                entry.isMe ? "bg-sky-900/30 border-sky-700" : "hover:bg-slate-800/50"
              }`}
            >
              <td className="px-4 py-3 font-mono text-slate-400">
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
              </td>
              <td className="px-4 py-3 font-medium text-slate-200">
                {entry.username}
                {entry.isMe && <span className="ml-2 text-xs text-sky-400">(you)</span>}
              </td>
              <td className={`px-4 py-3 font-mono font-bold ${pldbColor(entry.pldb)} ${pldbBg(entry.pldb)} rounded`}>
                {entry.pldb.toFixed(1)}
              </td>
              <td className="px-4 py-3 font-mono text-slate-400 hidden sm:table-cell">
                {entry.overpressure.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                {entry.design.noseAngle.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                {entry.design.fuselageRatio.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                {entry.design.wingSweep.toFixed(0)}°
              </td>
              <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                {entry.design.tailTaper.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                {entry.design.volumeDistribution.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
