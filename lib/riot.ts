import "server-only";
import { routes, type Analysis, type Server } from "./types";
import { normalizeMatch } from "./normalize";
import { createTransport, RiotError } from "./transport";
const request = createTransport();
const cache = new Map<string, { expires: number; value: Analysis }>();
const pending = new Map<string, Promise<Analysis>>();
export function hasApiKey() {
  return Boolean(
    process.env.RIOT_API_KEY &&
    process.env.RIOT_API_KEY !== "your_riot_api_key_here",
  );
}
export async function analyzeLive(
  gameName: string,
  tagLine: string,
  server: Server,
): Promise<Analysis> {
  const key = process.env.RIOT_API_KEY;
  if (!hasApiKey() || !key)
    throw new RiotError(
      503,
      "Live lookups need RIOT_API_KEY. Configure it on the server, or choose the labeled demo.",
    );
  const cacheKey = `${server}:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;
  const inflight = pending.get(cacheKey);
  if (inflight) return inflight;
  if (pending.size >= 10)
    throw new RiotError(
      429,
      "Too many players are being analyzed. Try again shortly.",
      10,
    );
  const task = (async () => {
    const host = `https://${routes[server].region}.api.riotgames.com`;
    const account = await request<{
      puuid?: string;
      gameName?: string;
      tagLine?: string;
    }>(
      `${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      key,
    );
    if (!account || typeof account.puuid !== "string")
      throw new RiotError(502, "Riot returned incomplete account data.");
    const puuid = account.puuid;
    const ids = await request<unknown>(
      `${host}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=420&start=0&count=20`,
      key,
    );
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string"))
      throw new RiotError(502, "Riot returned an invalid match list.");
    const selected = [...new Set(ids as string[])].slice(0, 20);
    const matches: Analysis["matches"] = [];
    let cursor = 0,
      failed = 0,
      skipped = 0;
    const errors: RiotError[] = [];
    await Promise.all(
      Array.from({ length: Math.min(3, selected.length) }, async () => {
        while (cursor < selected.length) {
          const id = selected[cursor++];
          if (!id.startsWith(`${routes[server].platform}_`)) {
            skipped++;
            continue;
          }
          try {
            const raw = await request<unknown>(
              `${host}/lol/match/v5/matches/${encodeURIComponent(id)}`,
              key,
            );
            const match = normalizeMatch(raw, puuid);
            if (match) matches.push(match);
            else skipped++;
          } catch (error) {
            failed++;
            if (error instanceof RiotError) errors.push(error);
          }
        }
      }),
    );
    if (failed > 0 && !matches.length)
      throw (
        errors[0] ??
        new RiotError(
          503,
          "No match details could be loaded. Please try again.",
        )
      );
    const notices: string[] = [];
    if (failed)
      notices.push(
        `${failed} of ${selected.length} match requests failed. Showing partial results; statistics use only available eligible matches.`,
      );
    if (errors.some((e) => e.status === 429))
      notices.push("Riot’s request limit was reached. Wait before refreshing.");
    if (errors.some((e) => e.status === 401 || e.status === 403))
      notices.push("Some requests were rejected. Check the server API key.");
    if (skipped)
      notices.push(
        `${skipped} records were outside the selected server/queue or lacked a matching participant and were omitted.`,
      );
    return {
      riotId: `${account.gameName || gameName}#${account.tagLine || tagLine}`,
      server,
      mode: "live" as const,
      matches: matches.sort((a, b) => b.startedAt - a.startedAt),
      requested: selected.length,
      failed,
      skipped,
      notices,
      fetchedAt: new Date().toISOString(),
    };
  })();
  pending.set(cacheKey, task);
  try {
    const value = await task;
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, {
      value,
      expires: Date.now() + (value.failed ? 15000 : 120000),
    });
    return value;
  } finally {
    pending.delete(cacheKey);
  }
}
