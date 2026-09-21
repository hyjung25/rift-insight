/** Transport is dependency-injectable for tests. Only riot.ts supplies a secret. */
export class RiotError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export function retryDelay(header: string | null, now = Date.now()): number {
  if (!header) return 1000;
  const seconds = Number(header);
  return Number.isFinite(seconds)
    ? Math.max(0, seconds * 1000)
    : Math.max(0, Date.parse(header) - now) || 1000;
}
const messages: Record<number, string> = {
  400: "Riot could not process this request. Check the Riot ID.",
  401: "The Riot API key is invalid or expired. Update RIOT_API_KEY on the server.",
  403: "Riot rejected the API key. It may be expired or lack access. Update the server configuration.",
  404: "No account or match was found. Check the Riot ID and selected server.",
  429: "Riot’s rate limit was reached. Please wait before trying again.",
};
export function createTransport(
  fetcher: typeof fetch = fetch,
  sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
) {
  let active = 0,
    cooldown = 0,
    nextSlot = 0;
  const waiting: (() => void)[] = [],
    requests: number[] = [];
  async function acquire() {
    if (active >= 3) {
      if (waiting.length >= 60)
        throw new RiotError(
          429,
          "Too many lookups are running. Please try again shortly.",
          10,
        );
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else active++;
  }
  function release() {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
  return async function request<T>(url: string, key: string): Promise<T> {
    await acquire();
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cooldown > Date.now())
          throw new RiotError(
            429,
            messages[429],
            Math.ceil((cooldown - Date.now()) / 1000),
          );
        // Space launches by 65ms (under 20/s); reserve the slot before awaiting.
        const slot = Math.max(Date.now(), nextSlot);
        nextSlot = slot + 65;
        if (slot > Date.now()) await sleep(slot - Date.now());
        if (cooldown > Date.now())
          throw new RiotError(
            429,
            messages[429],
            Math.ceil((cooldown - Date.now()) / 1000),
          );
        const now = Date.now();
        while (requests.length && requests[0] < now - 120000) requests.shift();
        if (requests.length >= 90)
          throw new RiotError(
            429,
            "The local request budget is busy. Please wait two minutes.",
            120,
          );
        // A three-worker pool bounds concurrent network requests across lookups.
        requests.push(now);
        let response: Response;
        try {
          response = await fetcher(url, {
            headers: { "X-Riot-Token": key },
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          });
        } catch {
          if (attempt < 2) {
            await sleep(500 * (attempt + 1));
            continue;
          }
          throw new RiotError(
            503,
            "Could not reach Riot. Please try again shortly.",
          );
        }
        if (response.ok) {
          try {
            return (await response.json()) as T;
          } catch {
            throw new RiotError(
              502,
              "Riot returned an unreadable response. Please try again.",
            );
          }
        }
        const delay = retryDelay(response.headers.get("Retry-After"));
        if (response.status === 429)
          cooldown = Math.max(cooldown, Date.now() + delay);
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < 2 &&
          delay <= 3000
        ) {
          await sleep(Math.max(delay, 500 * (attempt + 1)));
          continue;
        }
        throw new RiotError(
          response.status,
          messages[response.status] ??
            "Riot’s service is temporarily unavailable. Please try again later.",
          response.status === 429 ? Math.ceil(delay / 1000) : undefined,
        );
      }
      throw new RiotError(503, "Riot is temporarily unavailable.");
    } finally {
      release();
    }
  };
}
