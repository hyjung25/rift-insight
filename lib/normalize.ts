import type { Match, Role } from "./types";
const roles = new Set(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
const validNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
/** Missing core metrics exclude the whole record, rather than inventing zero values. */
export function normalizeMatch(raw: unknown, puuid: string): Match | null {
  const root = record(raw),
    info = record(root.info),
    metadata = record(root.metadata);
  if (info.queueId !== 420 || !Array.isArray(info.participants)) return null;
  const p = info.participants.map(record).find((p) => p.puuid === puuid);
  if (!p || typeof metadata.matchId !== "string") return null;
  const fields = [
    "kills",
    "deaths",
    "assists",
    "totalMinionsKilled",
    "neutralMinionsKilled",
    "totalDamageDealtToChampions",
    "visionScore",
  ];
  const complete =
    fields.every((key) => validNumber(p[key])) &&
    typeof p.win === "boolean" &&
    typeof p.championName === "string" &&
    validNumber(info.gameStartTimestamp) &&
    Number(info.gameStartTimestamp) > 0;
  // Modern match-v5 duration is seconds; end/start timestamps also support older payloads.
  const duration =
    validNumber(info.gameEndTimestamp) && validNumber(info.gameStartTimestamp)
      ? (info.gameEndTimestamp - info.gameStartTimestamp) / 1000
      : Number(info.gameDuration);
  const excluded =
    !complete || !Number.isFinite(duration) || duration <= 0
      ? "Incomplete match data"
      : p.gameEndedInEarlySurrender === true || duration < 300
        ? "Remake / match under 5 minutes"
        : null;
  const n = (key: string) => (validNumber(p[key]) ? (p[key] as number) : 0);
  return {
    id: metadata.matchId,
    champion: typeof p.championName === "string" ? p.championName : "Unknown",
    role: roles.has(String(p.teamPosition))
      ? (p.teamPosition as Role)
      : "UNKNOWN",
    win: p.win === true,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
    startedAt: validNumber(info.gameStartTimestamp)
      ? info.gameStartTimestamp
      : 0,
    kills: n("kills"),
    deaths: n("deaths"),
    assists: n("assists"),
    cs: n("totalMinionsKilled") + n("neutralMinionsKilled"),
    damage: n("totalDamageDealtToChampions"),
    vision: n("visionScore"),
    excluded,
  };
}
