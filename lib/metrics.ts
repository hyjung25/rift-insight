import type { Match } from "./types";
export const eligible = (matches: Match[]) =>
  matches.filter((m) => !m.excluded && m.duration >= 300);
export const perMinute = (value: number, duration: number) =>
  duration > 0 ? value / (duration / 60) : 0;
/** Zero deaths: use a denominator of 1, consistently for matches and aggregates. */
export const kda = (kills: number, deaths: number, assists: number) =>
  (kills + assists) / Math.max(1, deaths);
export function summarize(matches: Match[]) {
  const rows = eligible(matches),
    count = rows.length;
  const sum = (
    key:
      "kills" | "deaths" | "assists" | "cs" | "damage" | "vision" | "duration",
  ) => rows.reduce((acc, m) => acc + m[key], 0);
  const kills = sum("kills"),
    deaths = sum("deaths"),
    assists = sum("assists"),
    duration = sum("duration");
  const wins = rows.filter((m) => m.win).length;
  // Rates are duration-weighted: total activity / total minutes, not mean of match rates.
  return {
    count,
    wins,
    losses: count - wins,
    winRate: count ? (100 * wins) / count : 0,
    kills: count ? kills / count : 0,
    deaths: count ? deaths / count : 0,
    assists: count ? assists / count : 0,
    kda: kda(kills, deaths, assists),
    cs: perMinute(sum("cs"), duration),
    damage: perMinute(sum("damage"), duration),
    vision: perMinute(sum("vision"), duration),
  };
}
export function champions(matches: Match[]) {
  const rows = eligible(matches);
  return [...new Set(rows.map((m) => m.champion))]
    .map((name) => ({
      name,
      ...summarize(rows.filter((m) => m.champion === name)),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
