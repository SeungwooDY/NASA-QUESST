import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateSonicBoom } from "@/lib/physics";
import type { DesignParams } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const params: DesignParams = {
    noseAngle: Number(body.noseAngle),
    fuselageRatio: Number(body.fuselageRatio),
    wingSweep: Number(body.wingSweep),
    tailTaper: Number(body.tailTaper),
    volumeDistribution: Number(body.volumeDistribution),
  };

  // Server-side physics (authoritative — prevents cheating)
  const result = calculateSonicBoom(params);

  // Check personal best before inserting
  const { data: best } = await supabase
    .from("sim_results")
    .select("pldb")
    .eq("user_id", user.id)
    .order("pldb", { ascending: true })
    .limit(1)
    .maybeSingle();

  const isNewBest = !best || result.pldb < best.pldb;

  const { error } = await supabase.from("sim_results").insert({
    user_id: user.id,
    nose_angle: params.noseAngle,
    fuselage_ratio: params.fuselageRatio,
    wing_sweep: params.wingSweep,
    tail_taper: params.tailTaper,
    volume_distribution: params.volumeDistribution,
    pldb: result.pldb,
    overpressure: result.overpressure,
  });

  if (error) {
    console.error("Simulate insert error:", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }

  return NextResponse.json({ result, isNewBest });
}
