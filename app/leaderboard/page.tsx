import LeaderboardTable from "@/components/LeaderboardTable";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { LeaderboardEntry } from "@/lib/types";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: { user } },
    { data: rows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("leaderboard")
      .select("*")
      .order("pldb", { ascending: true })
      .limit(50),
  ]);

  const entries: LeaderboardEntry[] = (rows ?? []).map((row, idx) => ({
    rank: idx + 1,
    isMe: user?.id === row.user_id,
    username: row.username,
    pldb: row.pldb,
    overpressure: row.overpressure,
    design: {
      noseAngle: row.nose_angle,
      fuselageRatio: row.fuselage_ratio,
      wingSweep: row.wing_sweep,
      tailTaper: row.tail_taper,
      volumeDistribution: row.volume_distribution,
    },
    runAt: row.run_at,
  }));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Top 50 pilots ranked by sonic boom level (lower = quieter = better!)
          </p>
        </div>
        {user && (
          <Link
            href="/designer"
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Improve My Design
          </Link>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span className="text-slate-400">&lt;125 PLdB (quiet)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
          <span className="text-slate-400">125–135 PLdB (moderate)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="text-slate-400">&gt;135 PLdB (loud)</span>
        </span>
      </div>

      <LeaderboardTable entries={entries} />

      {entries.length === 0 && (
        <div className="mt-8 text-center">
          {user ? (
            <Link
              href="/designer"
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Run a Simulation & Be First!
            </Link>
          ) : (
            <Link
              href="/register"
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Register & Be First!
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
