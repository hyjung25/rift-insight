import { champions, eligible, perMinute } from "./metrics";
import type { Match } from "./types";
export function recentPatterns(matches: Match[]) {
  const rows = eligible(matches).sort((a, b) => b.startedAt - a.startedAt),
    result: {
      title: string;
      text: string;
      kind: "champion" | "trend" | "sample";
    }[] = [];
  const top = champions(rows)[0];
  if (rows.length >= 5 && top && top.count >= 3)
    result.push({
      title: "Your most-played pick",
      text: `You played ${top.name} in ${top.count} of ${rows.length} analyzed matches (${Math.round((top.count / rows.length) * 100)}%).`,
      kind: "champion",
    });
  if (rows.length >= 10) {
    const mean = (slice: Match[]) =>
      slice.reduce((sum, m) => sum + perMinute(m.cs, m.duration), 0) /
      slice.length;
    const current = mean(rows.slice(0, 5)),
      previous = mean(rows.slice(5, 10));
    result.push({
      title: "A look at your farming",
      text: `Average CS/min was ${current.toFixed(2)} in your most recent 5 matches and ${previous.toFixed(2)} in the previous 5 — ${Math.abs(current - previous) < 0.005 ? "about the same" : current > previous ? "higher recently" : "lower recently"}.`,
      kind: "trend",
    });
  }
  if (!result.length)
    result.push({
      title: "A little more data",
      text: `There are ${rows.length} analyzed matches in this view. Patterns need at least 5 matches; farming comparisons need 10.`,
      kind: "sample",
    });
  return result;
}
