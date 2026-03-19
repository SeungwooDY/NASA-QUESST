import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateSonicBoom } from "@/lib/physics";
import { rateLimit } from "@/lib/ratelimit";
import type { DesignParams } from "@/lib/types";

function clamp(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!isFinite(n)) throw new RangeError("Invalid parameter");
  return Math.max(min, Math.min(max, n));
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 10 simulations per minute per user
  if (!rateLimit(`simulate:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();

  let params: DesignParams;
  try {
    params = {
      noseAngle:           clamp(body.noseAngle,          0,   1),
      fuselageRatio:       clamp(body.fuselageRatio,      3,  12),
      wingSweep:           clamp(body.wingSweep,          0,  75),
      tailTaper:           clamp(body.tailTaper,          0,   1),
      volumeDistribution:  clamp(body.volumeDistribution, -1,  1),
    };
  } catch {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

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
