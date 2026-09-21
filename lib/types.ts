export type Server = "NA" | "KR";
export type Role =
  "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "UNKNOWN";
/** Stable, per-player feature record; no account identifiers needed for later analysis. */
export interface Match {
  id: string;
  champion: string;
  role: Role;
  win: boolean;
  duration: number;
  startedAt: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  damage: number;
  vision: number;
  excluded: string | null;
}
export interface Analysis {
  riotId: string;
  server: Server;
  mode: "demo" | "live";
  matches: Match[];
  requested: number;
  failed: number;
  skipped: number;
  notices: string[];
  fetchedAt: string;
}
export const roleNames: Record<Role, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
  UNKNOWN: "Unknown",
};
export const routes = {
  NA: { region: "americas", platform: "NA1" },
  KR: { region: "asia", platform: "KR" },
} as const;
