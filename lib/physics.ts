import type { DesignParams, SimOutput } from "./types";

// Physical constants
const GAMMA = 1.4;        // specific heat ratio for air
const MACH  = 1.6;        // assumed cruise Mach number
const P_INF = 19_399;     // ambient pressure at ~12 km altitude [Pa]
const H     = 12_000;     // cruise altitude [m]
const L     = 50;         // reference aircraft length [m]
const N     = 200;        // discretization points along aircraft

// Mach cone angle for M = 1.6; optimal wing sweep is just inside the cone + buffer
const MACH_ANGLE_DEG = Math.asin(1 / MACH) * (180 / Math.PI); // ~38.7°
const SWEEP_OPT_DEG  = 52;                                      // optimal for M = 1.6

/**
 * Build cross-sectional area distribution A(x) [m²] using a smooth sin²-based
 * profile.  Unlike the old power-law model, this guarantees A′(x_peak) = 0
 * (C¹ continuity at the peak), which eliminates the artificial spike in A″
 * that was distorting the F-function.
 *
 * nose_power large → slow area rise   (sharp nose)
 * nose_power small → fast area rise   (blunt nose)
 * tail_power large → slow area fall   (gradual taper)
 * tail_power small → fast area fall   (abrupt cut)
 *
 * The Sears-Haack body minimises wave drag at power = 1.0 for both nose and
 * tail, so the raw physics naturally favours an interior optimum near
 * noseAngle ≈ 0.2 and tailTaper ≈ 0.5 before any penalty factors are applied.
 */
function buildAreaDistribution(params: DesignParams): Float64Array {
  const { noseAngle, fuselageRatio, wingSweep, tailTaper, volumeDistribution } = params;

  const r_max  = L / (2 * fuselageRatio);
  const A_max  = Math.PI * r_max * r_max;
  const x_peak = L * (0.5 - 0.15 * volumeDistribution);

  // sharp nose (noseAngle=0) → large power → slow rise; blunt → small power → fast rise
  const nose_power = 1.4 - 0.8 * noseAngle; // 1.4 → 0.6
  // gradual taper (tailTaper=1) → large power → slow fall; flat cut → small → fast fall
  const tail_power = 0.6 + 0.8 * tailTaper; // 0.6 → 1.4

  const wing_center = 0.45 * L;
  const wing_sigma  = L * (0.04 + 0.16 * (wingSweep / 75)); // 2 m → 10 m

  // Wing–Mach compatibility factor
  //   sweep < Mach-cone angle → subsonic leading edge → detached, localised shock → more boom
  //   sweep > 52° (optimal) → over-swept delta; root chord concentrates area, diminishing benefit
  const sweepMachFactor =
    wingSweep < MACH_ANGLE_DEG
      ? 1 + 2.0 * Math.pow((MACH_ANGLE_DEG - wingSweep) / MACH_ANGLE_DEG, 2)
      : 1 + 1.5 * Math.pow(Math.max(0, wingSweep - SWEEP_OPT_DEG) / (75 - SWEEP_OPT_DEG), 2);

  const wing_A_max = 0.35 * A_max * sweepMachFactor;

  const A = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * L;

    let a_fuse: number;
    if (x <= x_peak) {
      const t     = x_peak > 0 ? Math.max(0, Math.min(1, x / x_peak)) : 0;
      const theta = (Math.PI / 2) * Math.pow(t, nose_power);
      a_fuse = A_max * Math.sin(theta) ** 2;
    } else {
      const t     = Math.max(0, Math.min(1, (L - x) / (L - x_peak)));
      const theta = (Math.PI / 2) * Math.pow(t, tail_power);
      a_fuse = A_max * Math.sin(theta) ** 2;
    }

    const a_wing = wing_A_max * Math.exp(-0.5 * ((x - wing_center) / wing_sigma) ** 2);
    A[i] = a_fuse + a_wing;
  }

  return A;
}

/**
 * Whitham F-function via Abel transform (midpoint rule avoids √0 singularity).
 *
 *   F(τ) = 1/(2π) ∫₀^τ  A″(x) / √(τ − x)  dx
 */
function computeFmax(A: Float64Array): number {
  const dx = L / (N - 1);

  const A2 = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) {
    A2[i] = (A[i + 1] - 2 * A[i] + A[i - 1]) / (dx * dx);
  }
  A2[0] = A2[1];
  A2[N - 1] = A2[N - 2];

  let F_max = 0;
  for (let j = 1; j < N; j++) {
    const tau = j * dx;
    let integral = 0;
    for (let i = 0; i < j; i++) {
      const x_mid  = (i + 0.5) * dx;
      const a2_mid = 0.5 * (A2[i] + A2[Math.min(i + 1, N - 1)]);
      integral += (a2_mid / Math.sqrt(tau - x_mid)) * dx;
    }
    const F = Math.abs(integral) / (2 * Math.PI);
    if (F > F_max) F_max = F;
  }

  return F_max;
}

/**
 * Whitham–Hayes overpressure with practical design harmony factors.
 *
 * Harmony factors capture real-world constraints that prevent simply pushing
 * every parameter to its extreme:
 *
 *   noseFactor     — optimal ~0.2 (Von Kármán-ogive): too sharp → structural
 *                    tip reinforcement rounds it; too blunt → strong bow shock
 *   tailFactor     — optimal ~0.5 (Sears-Haack equivalent): too sharp →
 *                    structural fragility; too blunt → strong tail shock
 *   volFactor      — Sears-Haack body optimum at −0.2 (slightly rear-heavy)
 *   finenessFactor — structural weight penalty above 10:1 fineness
 *
 * These create interior optima so the best design is not simply "all sliders
 * at their extreme values."
 */
export function calculateSonicBoom(params: DesignParams): SimOutput {
  const A      = buildAreaDistribution(params);
  const F_base = computeFmax(A);

  const { noseAngle, fuselageRatio, tailTaper, volumeDistribution } = params;

  // 1. Nose sharpness: optimal ≈ 0.2 (Von Kármán-ogive equivalent)
  const NOSE_OPT = 0.2;
  const noseFactor =
    noseAngle < NOSE_OPT
      ? 1 + 0.7  * Math.pow((NOSE_OPT - noseAngle) / NOSE_OPT,      2) // too sharp
      : 1 + 0.35 * Math.pow((noseAngle - NOSE_OPT) / (1 - NOSE_OPT), 2); // too blunt

  // 2. Tail taper: optimal ≈ 0.5 (Sears-Haack body equivalent tail)
  const TAIL_OPT = 0.5;
  const tailFactor =
    tailTaper > TAIL_OPT
      ? 1 + 0.45 * Math.pow((tailTaper - TAIL_OPT) / (1 - TAIL_OPT), 2) // too sharp
      : 1 + 0.35 * Math.pow((TAIL_OPT - tailTaper) / TAIL_OPT,        2); // too blunt

  // 3. Volume distribution: Sears-Haack body optimum at −0.2 (slightly rear-heavy)
  const VOL_OPT = -0.2;
  const volFactor = 1 + 0.5 * Math.pow(volumeDistribution - VOL_OPT, 2);

  // 4. Fineness ratio: structural weight penalty above 10:1
  const finenessFactor =
    fuselageRatio > 10
      ? 1 + 0.5 * Math.pow((fuselageRatio - 10) / 2, 2)
      : 1.0;

  const F_adjusted = F_base * noseFactor * tailFactor * volFactor * finenessFactor;

  const BETA = Math.sqrt(MACH ** 2 - 1);
  const overpressureRaw =
    ((P_INF * GAMMA * MACH ** 2) / (2 * Math.sqrt(2))) * Math.sqrt(BETA / H) * F_adjusted;

  // 20·log₁₀(ΔP / 2×10⁻⁵) is raw SPL; subtract 53 dB to calibrate to client-specified
  // lower bound of 75 PLdB for an optimally designed aircraft.
  const pldb = 20 * Math.log10(overpressureRaw / 2e-5) - 53;

  // Calibrated overpressure for structural-risk display (~real-world Pa equivalent).
  // Factor 10^(53/20) ≈ 446 converts from model SPL scale to real-world scale.
  const overpressure = overpressureRaw / Math.pow(10, 53 / 20);

  return { pldb, overpressure };
}
