"use client";

import type { DesignParams } from "@/lib/types";

interface AircraftSVGProps {
  params: DesignParams;
}

export default function AircraftSVG({ params }: AircraftSVGProps) {
  const { noseAngle, fuselageRatio, wingSweep, tailTaper, volumeDistribution } = params;

  const cy = 100;
  // Fuselage half-height: blunter (high ratio) = fatter
  const halfH = 20 + (1 - (fuselageRatio - 3) / 9) * 20; // 20–40px

  // Nose section (x=50–170): cubic bezier
  // noseAngle=0 (sharp) → control point stays left; noseAngle=1 (blunt) → pushes right
  const noseX = 50;
  const fuselageStartX = 170;
  const fuselageEndX = 330;
  const tailEndX = 450;

  // Nose bezier control points
  const noseTipX = noseX + noseAngle * 40; // sharper=50, blunter=90
  const noseCtrl1X = noseTipX + 20 + noseAngle * 20;
  const noseCtrl2X = fuselageStartX - 20;

  // Wing parameters
  const wingRootStartX = 220;
  const wingRootEndX = 270;
  const wingTipSweepOffset = (wingSweep / 75) * 80; // 0–80px back
  const wingSpan = 60 + (1 - wingSweep / 75) * 20; // 60–80px half-span

  // Wing polygon points (below fuselage)
  const wingPoints = [
    `${wingRootStartX},${cy + halfH}`,
    `${wingRootEndX},${cy + halfH}`,
    `${wingRootEndX + wingTipSweepOffset},${cy + halfH + wingSpan}`,
    `${wingRootStartX + wingTipSweepOffset * 0.8},${cy + halfH + wingSpan}`,
  ].join(" ");

  // Upper wing for symmetry
  const wingPointsUpper = [
    `${wingRootStartX},${cy - halfH}`,
    `${wingRootEndX},${cy - halfH}`,
    `${wingRootEndX + wingTipSweepOffset},${cy - halfH - wingSpan}`,
    `${wingRootStartX + wingTipSweepOffset * 0.8},${cy - halfH - wingSpan}`,
  ].join(" ");

  // Tail cone: tailTaper=1 → sharp point, tailTaper=0 → flat cut
  const tailCutHeight = halfH * (1 - tailTaper) + 2; // min 2px
  const tailCtrl1X = fuselageEndX + 40;
  const tailCtrl2X = tailEndX - 20;

  // Volume distribution gradient
  const gradientId = "volGrad";
  // volumeDistribution: -1=rear heavy (light→dark), 0=uniform, 1=front heavy (dark→light)
  const frontOpacity = 0.3 + 0.35 * (volumeDistribution + 1); // 0.3–1.0
  const rearOpacity = 1.0 - 0.35 * (volumeDistribution + 1);  // 0.3–1.0

  return (
    <svg
      viewBox="0 0 500 200"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      style={{ background: "#0f172a", borderRadius: "8px" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={frontOpacity} />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity={rearOpacity} />
        </linearGradient>
      </defs>

      {/* Wings */}
      <polygon points={wingPoints} fill="#64748b" opacity="0.9" />
      <polygon points={wingPointsUpper} fill="#64748b" opacity="0.9" />

      {/* Fuselage body */}
      <rect
        x={fuselageStartX}
        y={cy - halfH}
        width={fuselageEndX - fuselageStartX}
        height={halfH * 2}
        fill={`url(#${gradientId})`}
      />

      {/* Nose section (top curve) */}
      <path
        d={`M ${fuselageStartX} ${cy - halfH}
            C ${noseCtrl2X} ${cy - halfH},
              ${noseCtrl1X} ${cy - halfH * 0.3},
              ${noseTipX} ${cy}
            C ${noseCtrl1X} ${cy + halfH * 0.3},
              ${noseCtrl2X} ${cy + halfH},
              ${fuselageStartX} ${cy + halfH}
            Z`}
        fill={`url(#${gradientId})`}
      />

      {/* Tail cone */}
      <path
        d={`M ${fuselageEndX} ${cy - halfH}
            C ${tailCtrl1X} ${cy - halfH},
              ${tailCtrl2X} ${cy - tailCutHeight},
              ${tailEndX} ${cy - tailCutHeight}
            L ${tailEndX} ${cy + tailCutHeight}
            C ${tailCtrl2X} ${cy + tailCutHeight},
              ${tailCtrl1X} ${cy + halfH},
              ${fuselageEndX} ${cy + halfH}
            Z`}
        fill={`url(#${gradientId})`}
      />

      {/* Small tail fins */}
      <polygon
        points={`${fuselageEndX + 30},${cy - halfH} ${fuselageEndX + 80},${cy - halfH - 25} ${fuselageEndX + 80},${cy - halfH}`}
        fill="#475569"
        opacity="0.9"
      />
      <polygon
        points={`${fuselageEndX + 30},${cy + halfH} ${fuselageEndX + 80},${cy + halfH + 25} ${fuselageEndX + 80},${cy + halfH}`}
        fill="#475569"
        opacity="0.9"
      />

      {/* Cockpit canopy */}
      <ellipse
        cx={fuselageStartX + 30}
        cy={cy - halfH + 4}
        rx={18}
        ry={8}
        fill="#7dd3fc"
        opacity="0.6"
      />
    </svg>
  );
}
