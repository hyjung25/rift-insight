import type { Analysis, Match, Server } from "./types";
// Fixed synthetic fixtures. These are not a real player's history.
const picks = [
  "Ahri",
  "Ahri",
  "Syndra",
  "Ahri",
  "Orianna",
  "Akali",
  "Syndra",
  "Ahri",
  "Yone",
  "Orianna",
  "Ahri",
  "Syndra",
  "Akali",
  "Ahri",
  "Yone",
  "Orianna",
  "Syndra",
  "Ahri",
  "Akali",
  "Ahri",
];
export function demoAnalysis(server: Server = "KR"): Analysis {
  const matches: Match[] = picks.map((champion, i) => {
    const duration = (26 + ((i * 7) % 13)) * 60 + ((i * 13) % 60);
    return {
      id: `DEMO_${20 - i}`,
      champion,
      role: i === 7 || i === 14 ? "TOP" : "MIDDLE",
      win: ![2, 5, 8, 10, 13, 16, 18].includes(i),
      duration,
      startedAt: Date.UTC(2026, 8, 20, 20) - i * 8 * 3600000,
      kills: [9, 7, 4, 11, 6, 3, 8, 5][i % 8],
      deaths: [2, 3, 6, 1, 4, 7, 3, 2][i % 8],
      assists: [8, 10, 5, 6, 12, 4, 9, 11][i % 8],
      cs: Math.round(
        (duration / 60) * (i < 5 ? 7.8 + (i % 3) * 0.4 : 6.3 + (i % 4) * 0.5),
      ),
      damage: 19000 + ((i * 3137) % 16000),
      vision: 17 + ((i * 7) % 20),
      excluded: null,
    };
  });
  return {
    riotId: "Rift Explorer#DEMO",
    server,
    mode: "demo",
    matches,
    requested: 20,
    failed: 0,
    skipped: 0,
    notices: [],
    fetchedAt: "2026-09-21T00:00:00.000Z",
  };
}
