"use client";

import { useEffect, useRef, useState } from "react";
import type { SimOutput } from "@/lib/types";

interface SimulationCanvasProps {
  pldb: number;
  overpressure: number;
  onComplete?: (result: SimOutput) => void;
}

const W = 800;
const H = 400;
const GROUND_Y = 340;
const AIRCRAFT_Y = 120;

const PHASE_FLIGHT_END = 800;
const PHASE_CONE_END = 3500;
const PHASE_IMPACT_END = 4000;

export default function SimulationCanvas({ pldb, overpressure, onComplete }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [done, setDone] = useState(false);

  // intensity 0=best(green), 1=worst(red)
  const intensity = Math.max(0, Math.min(1, (pldb - 100) / 35));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    startRef.current = performance.now();
    const coneR = Math.round(intensity * 255);
    const coneG = Math.round((1 - intensity) * 200);
    const coneColor = `rgba(${coneR}, ${coneG}, 30`;

    // Mach cone half-angle: arcsin(1/1.5) ≈ 41.8° — stored as tan for drawing
    const MACH = 1.5;
    const sineAngle = 1 / MACH; // sin(μ) = 1/M
    const coneSlope = sineAngle / Math.sqrt(1 - sineAngle * sineAngle); // tan(μ)

    function drawBackground() {
      if (!ctx) return;
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, "#0c1445");
      skyGrad.addColorStop(1, "#1a3a6b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, GROUND_Y);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      groundGrad.addColorStop(0, "#2d4a1e");
      groundGrad.addColorStop(1, "#1a2e12");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // Ground line
      ctx.strokeStyle = "#4a7a2e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % W;
        const sy = (i * 73.1) % (GROUND_Y * 0.8);
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    function drawAircraft(x: number, y: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);

      // Fuselage
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(44, 0);
      ctx.lineTo(28, 4);
      ctx.lineTo(28, -4);
      ctx.fill();

      // Wings
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(8, -28);
      ctx.lineTo(14, -28);
      ctx.lineTo(6, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(8, 28);
      ctx.lineTo(14, 28);
      ctx.lineTo(6, 6);
      ctx.fill();

      // Tail fin
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(-20, -6);
      ctx.lineTo(-28, -18);
      ctx.lineTo(-22, -6);
      ctx.fill();

      ctx.restore();
    }

    function drawMachCone(acX: number, progress: number) {
      if (!ctx) return;
      // progress: 0→1 over the cone expansion phase
      const maxLen = acX - 0; // cone extends to left edge

      ctx.save();
      ctx.globalAlpha = 0.35 * progress;

      // Cone lines (upper and lower)
      const coneLen = maxLen * progress;
      const spreadY = coneLen * coneSlope;

      ctx.strokeStyle = `${coneColor}, 0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(acX, AIRCRAFT_Y);
      ctx.lineTo(acX - coneLen, AIRCRAFT_Y - spreadY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(acX, AIRCRAFT_Y);
      ctx.lineTo(acX - coneLen, AIRCRAFT_Y + spreadY);
      ctx.stroke();

      // N-wave arcs radiating outward
      const numArcs = Math.floor(progress * 5);
      for (let i = 1; i <= numArcs; i++) {
        const arcProgress = (progress - (i - 1) / 5) * 5;
        if (arcProgress <= 0) continue;
        const arcDist = coneLen * (i / 5);
        const arcSpread = arcDist * coneSlope;
        const alpha = Math.max(0, 0.6 - i * 0.1) * arcProgress;

        ctx.strokeStyle = `${coneColor}, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(acX - arcDist, AIRCRAFT_Y - arcSpread);
        ctx.quadraticCurveTo(
          acX - arcDist - 20,
          AIRCRAFT_Y,
          acX - arcDist,
          AIRCRAFT_Y + arcSpread
        );
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawImpactFlash(progress: number) {
      if (!ctx) return;
      const alpha = Math.sin(progress * Math.PI) * 0.7;
      ctx.fillStyle = `rgba(255, ${Math.round(200 * (1 - intensity))}, 50, ${alpha})`;
      ctx.fillRect(0, GROUND_Y - 10, W, 30);

      // Shock wave ripples on ground
      for (let i = 0; i < 3; i++) {
        const rippleR = progress * 200 * (i + 1) * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.5 / (i + 1)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(W / 2, GROUND_Y + 5, rippleR, rippleR * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function frame(now: number) {
      const elapsed = now - startRef.current;
      ctx!.clearRect(0, 0, W, H);
      drawBackground();

      if (elapsed < PHASE_FLIGHT_END) {
        // Phase 1: Aircraft flies left → right
        const t = elapsed / PHASE_FLIGHT_END;
        const acX = 50 + t * (W - 100);
        drawAircraft(acX, AIRCRAFT_Y);
      } else if (elapsed < PHASE_CONE_END) {
        // Phase 2: Aircraft at right, cone expands
        const acX = W - 50;
        drawAircraft(acX, AIRCRAFT_Y);
        const coneProgress = (elapsed - PHASE_FLIGHT_END) / (PHASE_CONE_END - PHASE_FLIGHT_END);
        drawMachCone(acX, coneProgress);
      } else if (elapsed < PHASE_IMPACT_END) {
        // Phase 3: Wave hits ground — flash
        const acX = W - 50;
        drawAircraft(acX, AIRCRAFT_Y);
        drawMachCone(acX, 1.0);
        const impactProgress = (elapsed - PHASE_CONE_END) / (PHASE_IMPACT_END - PHASE_CONE_END);
        drawImpactFlash(impactProgress);
      } else {
        // Phase 4: Done
        const acX = W - 50;
        drawAircraft(acX, AIRCRAFT_Y);
        drawMachCone(acX, 1.0);
        setDone(true);
        onComplete?.({ pldb, overpressure });
        return;
      }

      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pldb, overpressure, onComplete, intensity]);

  const pldbColor =
    pldb < 110
      ? "text-green-400"
      : pldb < 120
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg border border-slate-700"
        style={{ imageRendering: "auto" }}
      />

      {done && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-slate-900/95 border border-slate-600 rounded-xl p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="text-slate-400 text-sm uppercase tracking-wider mb-2">
              Simulation Complete
            </div>
            <div className={`text-5xl font-bold font-mono ${pldbColor} mb-1`}>
              {pldb.toFixed(1)}
            </div>
            <div className="text-slate-300 text-lg mb-3">PLdB</div>
            <div className="text-slate-400 text-sm mb-4">
              Overpressure: <span className="text-slate-200 font-mono">{overpressure.toFixed(1)} Pa</span>
            </div>
            <div className={`text-sm font-medium ${pldbColor}`}>
              {pldb < 108
                ? "Excellent design! Very quiet boom."
                : pldb < 113
                ? "Good design! Quieter than average."
                : pldb < 118
                ? "Average sonic boom level."
                : pldb < 125
                ? "Pretty loud! Try a sharper nose."
                : "Very loud boom! Improve your design."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
