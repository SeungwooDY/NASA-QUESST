import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { RunHistory } from "@/lib/types";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sim_results")
    .select(
      "id, pldb, overpressure, nose_angle, fuselage_ratio, wing_sweep, tail_taper, volume_distribution, run_at"
    )
    .eq("user_id", user.id)
    .order("run_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  const history: RunHistory[] = (data ?? []).map((row) => ({
    id: row.id,
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

  return NextResponse.json({ history });
}
