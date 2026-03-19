export interface DesignParams {
  noseAngle: number;          // 0–1 normalized (0=sharp, 1=blunt)
  fuselageRatio: number;      // 3–12 fineness ratio (length/diameter)
  wingSweep: number;          // 0–75 degrees
  tailTaper: number;          // 0–1 (0=flat cut, 1=sharp taper)
  volumeDistribution: number; // -1–1 (-1=rear heavy, 0=uniform, 1=front heavy)
}

export interface SimOutput {
  pldb: number;        // perceived level in dB
  overpressure: number; // ΔP in Pascals
}

export interface LeaderboardEntry {
  rank: number;
  isMe: boolean;
  username: string;
  pldb: number;
  overpressure: number;
  design: DesignParams;
  runAt: string;
}

export interface RunHistory {
  id: number;
  pldb: number;
  overpressure: number;
  design: DesignParams;
  runAt: string;
}
