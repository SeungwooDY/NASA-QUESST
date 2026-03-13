import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { LeaderboardEntry } from "@/lib/types";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("pldb", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  const entries: LeaderboardEntry[] = (data ?? []).map((row, idx) => ({
    rank: idx + 1,
    userId: row.user_id,
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

  return NextResponse.json({ entries });
}
