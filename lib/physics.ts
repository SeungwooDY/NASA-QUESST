import type { DesignParams, SimOutput } from "./types";

// Physical constants
const GAMMA = 1.4;       // specific heat ratio for air
const MACH = 1.6;        // assumed cruise Mach number
const P_INF = 19_399;    // ambient pressure at ~12 km altitude [Pa]
const H = 12_000;        // cruise altitude [m]
const L = 50;            // reference aircraft length [m]
const N = 200;           // discretization points along aircraft

/**
 * Build cross-sectional area distribution A(x) [m²] at N evenly-spaced
 * points from x=0 (nose) to x=L (tail), driven by the 5 design parameters.
 */
function buildAreaDistribution(params: DesignParams): Float64Array {
  const { noseAngle, fuselageRatio, wingSweep, tailTaper, volumeDistribution } = params;

  // Max fuselage cross-section from fineness ratio (fuselageRatio = L / D)
  const r_max = L / (2 * fuselageRatio);
  const A_max = Math.PI * r_max * r_max;

  // Peak location shifted by volume distribution
  // -1 (rear-heavy) → peak at 0.65L;  0 → 0.50L;  +1 (front-heavy) → 0.35L
  const x_peak = L * (0.5 - 0.15 * volumeDistribution);

  // Nose rise exponent: sharp nose (noseAngle=0) → A ∝ x^2.5 (slow rise)
  //                     blunt nose (noseAngle=1) → A ∝ x^0.5 (rapid rise)
  const nose_exp = 2.5 - 2.0 * noseAngle;

  // Tail fall exponent: tapered (tailTaper=1) → (1-t)^2.5; flat cut → (1-t)^0.5
  const tail_exp = 0.5 + 2.0 * tailTaper;

  // Wing area Gaussian bump: more sweep → wider, shallower bump
  const wing_center = 0.45 * L;
  const wing_sigma = L * (0.04 + 0.16 * (wingSweep / 75));
  const wing_A_max = 0.35 * A_max;

  const A = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * L;

    // Fuselage cross-section (power-law rise then fall)
    let a_fuse: number;
    if (x <= x_peak) {
      a_fuse = x_peak > 0 ? A_max * Math.pow(x / x_peak, nose_exp) : 0;
    } else {
      a_fuse = A_max * Math.pow((L - x) / (L - x_peak), tail_exp);
    }

    // Wing contribution (Gaussian bump)
    const a_wing = wing_A_max * Math.exp(-0.5 * ((x - wing_center) / wing_sigma) ** 2);

    A[i] = a_fuse + a_wing;
  }

  return A;
}

/**
 * Compute the Whitham F-function via Abel transform and return its maximum.
 *
 *   F(τ) = 1/(2π) ∫₀^τ  A''(x) / √(τ − x)  dx
 *
 * A in m², x in m  →  A'' dimensionless  →  F in m^(1/2)
 *
 * Midpoint rule avoids the integrable √0 singularity at x = τ.
 */
function computeFmax(A: Float64Array): number {
  const dx = L / (N - 1);

  // Second derivative A''(x) via central differences
  const A2 = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) {
    A2[i] = (A[i + 1] - 2 * A[i] + A[i - 1]) / (dx * dx);
  }
  A2[0] = A2[1];
  A2[N - 1] = A2[N - 2];

  // Abel integral: midpoint rule over sub-intervals [i·dx, (i+1)·dx]
  let F_max = 0;
  for (let j = 1; j < N; j++) {
    const tau = j * dx;
    let integral = 0;
    for (let i = 0; i < j; i++) {
      const x_mid = (i + 0.5) * dx;                         // midpoint avoids √0
      const a2_mid = 0.5 * (A2[i] + A2[Math.min(i + 1, N - 1)]);
      integral += (a2_mid / Math.sqrt(tau - x_mid)) * dx;
    }
    const F = Math.abs(integral) / (2 * Math.PI);
    if (F > F_max) F_max = F;
  }

  return F_max;
}

/**
 * Whitham–Hayes far-field sonic boom overpressure at ground level:
 *
 *   ΔP = P_∞ · γ · M² / (2√(2H)) · F_max
 *
 * Then convert to Perceived Level in dB:
 *   PLdB = 20 · log₁₀(ΔP / 2×10⁻⁵)
 */
export function calculateSonicBoom(params: DesignParams): SimOutput {
  const A = buildAreaDistribution(params);
  const F_max = computeFmax(A);

  const overpressure = ((P_INF * GAMMA * MACH ** 2) / (2 * Math.sqrt(2 * H))) * F_max;
  const pldb = 20 * Math.log10(overpressure / 2e-5);

  return { pldb, overpressure };
}
