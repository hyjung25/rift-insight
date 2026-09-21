# Rift Insight

A focused League of Legends player analytics dashboard built with **Next.js App Router, TypeScript, React, and Tailwind CSS**. Enter a Riot ID, choose NA or KR, and analyze up to 20 recent ranked solo/duo games. The interface includes aggregate stats, champion performance, win-rate and CS/min charts, match details, consistent champion/role filters, and deterministic recent-pattern observations.

No authentication, database, chatbot, model training, or rank benchmarks. All statistics describe the retrieved, filtered sample—not the entire season.

## API overview (assignment summary)

Rift Insight uses JavaScript's built-in `fetch` with `async/await` inside a Next.js server route to call Riot's ACCOUNT-V1 and MATCH-V5 APIs. A Riot ID (`gameName#tagLine`) resolves to a PUUID, and the selected server determines regional routing: NA uses Americas and KR uses Asia. The match-list request supplies `queue=420`, `start=0`, and `count=20`, then the server retrieves each available match's details. Riot returns JSON objects and arrays containing strings, numbers, and booleans; TypeScript normalization extracts champion, role, result, duration, K/D/A, minions, damage, and vision for interactive statistics and charts. Authentication uses the server-only `RIOT_API_KEY` environment variable in the `X-Riot-Token` header, so the browser never receives the secret.

**Submission materials:** [AI prompt log](prompt_log.md) · [Portfolio copy, video guide, and checklist](docs/submission.md) · [Verification record](docs/verification.md)

Repository: https://github.com/hyjung25/rift-insight · [Portfolio project](https://hyjung25.github.io/#rift-insight)

## Run locally

Use Node.js 20.9+ (Node 24 LTS recommended) and npm.

```sh
# From the project directory containing package.json:
npm install
npm run dev
```

Open http://localhost:3000. Without a key, the initial screen explicitly shows **demo data**: 20 fixed synthetic matches for `Rift Explorer#DEMO`. This identity never changes to the searched player's name. Bundled champion art makes the demo independent of Riot asset requests.

For live lookups:

```sh
cp .env.example .env.local
```

Replace the placeholder in `.env.local`:

```dotenv
RIOT_API_KEY=your_riot_api_key_here
```

Get a key from the [Riot Developer Portal](https://developer.riotgames.com/). Restart the server after changing it. Never use `NEXT_PUBLIC_` for a secret. `.env*` is ignored except `.env.example`; no key is included in source, response payloads, or logs. `lib/riot.ts` imports `server-only` to prevent accidental client imports.

When a key exists, the app starts with a search state. Demo data can still be selected explicitly. **A failed live request never falls back to demo.** If an unsuccessful search clears the previous dashboard, the error state belongs to the newly requested player, so stale statistics cannot be mistaken for that player's data.

```sh
npm run test
npm run typecheck
npm run build
npm start
```

## Public API and request flow

Official documentation checked September 21, 2026:

- [League of Legends APIs, routing, Riot IDs and Data Dragon](https://developer.riotgames.com/docs/lol)
- [ACCOUNT-V1 by Riot ID](https://developer.riotgames.com/apis#account-v1/GET_getByRiotId)
- [MATCH-V5 match IDs](https://developer.riotgames.com/apis#match-v5/GET_getMatchIdsByPUUID)
- [MATCH-V5 match detail](https://developer.riotgames.com/apis#match-v5/GET_getMatch)
- [API keys, response codes and rate limiting](https://developer.riotgames.com/docs/portal)
- [General developer policies](https://developer.riotgames.com/policies/general)

1. The browser sends `POST /api/analyze` with `{ "riotId": "Player#NA1", "server": "NA", "demo": false }`. Client validation gives quick feedback; server validation remains authoritative. Names support Unicode; the accepted input is a 3–16 character name and a 3–5 alphanumeric tag. Inputs are URL-encoded.
2. The route resolves the account using `GET https://{region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`.
3. The returned PUUID is used for `GET /lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&start=0&count=20`.
4. Up to 20 unique IDs are fetched through `GET /lol/match/v5/matches/{matchId}`. The account and match endpoints use **regional** routing. NA maps to `americas`; KR maps to `asia`. Match prefixes are checked against `NA1_` and `KR_`, respectively, so transfers cannot mix other platforms into the selected server's analysis.
5. Normalization finds the participant with the requested PUUID and extracts a compact typed record. Wrong-queue, wrong-platform and missing-participant records are counted as skipped. Matches are sorted newest first.
6. The browser applies both filters to the normalized records. One shared filtered set feeds summary cards, champion breakdowns, both charts, observations, and history. History retains excluded records with reasons. The analyzed count excludes those records.

The API key is sent only from the server to Riot over HTTPS in `X-Riot-Token`. No OAuth/RSO is required for this public account/match flow. The PUUID and raw payloads are not sent to the browser or persisted.

## Async/await, caching and errors

`analyzeLive` awaits the account, then awaits the match ID list because each step needs the previous result. Three workers use `Promise.all` to fetch independent details. Individual detail failures are caught, allowing useful partial results. A shared transport semaphore caps concurrent Riot requests at three across lookups. Launches are spaced at least 65ms apart, and a conservative shared budget allows 90 attempts per 120 seconds. This also applies across NA and KR, intentionally below Riot's per-region personal limits.

`response.ok` is checked before JSON parsing. Error bodies are not relied upon, echoed, or logged. Account/list structure is checked before use; match fields are validated during normalization. Each fetch has a 10-second timeout. Network errors and 5xx responses get at most two retries. A 429 sets a shared cooldown. `Retry-After` accepts seconds or HTTP dates; a wait up to three seconds can be retried, while longer waits are returned to the user without an early retry. Already in-flight requests may finish; queued requests re-check cooldown before contacting Riot.

Successful analyses are cached in memory for 120 seconds; partial results for 15 seconds. The cache is capped at 100 entries. Concurrent requests for the same server/ID reuse one promise. At most ten distinct analyses can be in flight, and the transport queue is bounded. The browser response uses `Cache-Control: no-store`. Refreshing a cached lookup may show the previous retrieval until expiration.

- Invalid IDs/regions: 400 with an actionable message.
- Missing accounts: 404.
- Invalid/expired/unauthorized keys: configuration error, with no secret disclosure.
- Unreachable Riot or malformed upstream responses: explicit service error.
- Rate limits: 429 and a retry interval where available.
- Some failed details: available results plus a visible partial-results notice.
- All detail requests fail: an error, never an empty success or a demo substitution.
- No recent matching games: a genuine empty state.

This cache, semaphore, and budget are **per process**. A production deployment with several instances needs a shared limiter/cache and edge abuse protection. This first version intentionally does not add that infrastructure. Riot rate limits still apply to other applications sharing the same key.

## Metric definitions

Eligible matches are queue 420, at least 300 seconds long, not flagged `gameEndedInEarlySurrender`, and complete for core fields. The duration uses `(gameEndTimestamp - gameStartTimestamp) / 1000` when both are present, otherwise modern Match-V5 `gameDuration` in seconds. The early-surrender flag is used as a conservative remake proxy: it may exclude some early-surrender games beyond literal remakes. Missing or invalid core data excludes the entire record; zeros are valid values. Although Riot's general portal permits treating omitted numeric fields as zero, this app conservatively excludes such records and explains why rather than guessing.

| Metric | Calculation on eligible filtered matches |
|---|---|
| Win rate | wins / games × 100 |
| Average K/D/A | separate arithmetic means of kills, deaths, assists |
| Aggregate KDA | (sum kills + sum assists) / max(1, sum deaths) |
| CS/min | sum(totalMinionsKilled + neutralMinionsKilled) / sum(duration in minutes) |
| Damage/min | sum(totalDamageDealtToChampions) / sum(minutes) |
| Vision/min | sum(visionScore) / sum(minutes) |
| Champion stats | same formulas on that champion's filtered subset |
| Match rates and line chart | the individual match's value / minutes |

Rates on summary cards are duration-weighted; they are not an average of match-level rates. A zero-death sample uses denominator 1 rather than infinity. Empty samples show an empty state, not fabricated zero performance. Unknown roles are retained as `UNKNOWN` and can be filtered. Match dates are UTC. Champion sample counts are printed beside chart bars and included in their accessible label; exact CS/min values are also available in match history.

The expandable **How metrics are calculated** section repeats these rules in the app.

### Sanitized response example

[`docs/sanitized-match.json`](docs/sanitized-match.json) is a synthetic, sanitized, abridged Match-V5-shaped response (not a captured live request). Its PUUID selects Ahri's participant. `teamPosition: MIDDLE` displays as Mid. `win: true` becomes Victory. `gameDuration: 1200` is 20 minutes. `kills/deaths/assists: 8/2/6` becomes **8 / 2 / 6**, KDA **7.00**, and `(150 + 10) / 20` gives **8.0 CS/min**. Damage rate is `16000 / 20 = 800`, and vision rate is `20 / 20 = 1.00`. Other participants and unrelated fields are deliberately omitted.

## Recent patterns and limitations

Patterns are ordinary deterministic TypeScript rules, not AI coaching. A most-played observation needs at least five eligible matches and at least three on the champion. Farming comparisons require ten eligible matches, compare mean match-level CS/min for the latest five against the preceding five, and show both counts and values. Filters are applied before either rule. Ties are described as about the same after two-decimal rounding.

Twenty games is a small, potentially biased sample. Roles, game lengths, champion choice, patch changes, missing matches and remakes affect interpretation. The app never claims causality, predicts wins, invents rank benchmarks, or measures overall skill. No rank is displayed because league data is outside this scoped integration. A regional list can include transferred-server matches; those are omitted without backfilling, so fewer than twenty may remain. Cached data may be two minutes old. Asset versions may lag a new champion; the image component falls back to text if an image is unavailable.

## Riot requirements and attribution

Riot's current portal says development keys deactivate every 24 hours and are for prototyping. Personal keys are for private/personal use; public alpha/beta access also requires a production key. Before publishing a live app, register the product and obtain the appropriate production access. Keep registration metadata current and review policies before release. A public demo without live access still uses Riot IP, so product registration requirements should be reviewed. Do not deploy a development/personal key for public consumption.

The visible footer includes Riot's required non-endorsement notice. Champion portraits and splash art are official Data Dragon game-specific static assets; no Riot corporate logo is used. Bundled portraits use version `16.18.1`, the version listed by official docs when checked. New champion images use the same official CDN with a text fallback. See [`public/assets/ATTRIBUTION.md`](public/assets/ATTRIBUTION.md).

## Code walkthrough for class

| File | What to explain |
|---|---|
| `app/page.tsx` | Server-only key presence check; demo vs live search starting state |
| `app/api/analyze/route.ts` | JSON request parsing, validation, explicit demo/live branching, safe responses |
| `lib/validation.ts` | Shared input rules and supported servers |
| `lib/riot.ts` | Sequential account/list calls, detail workers, deduplication, cache and partial results |
| `lib/transport.ts` | Fetch, timeout, semaphore, pacing, rate budget, retry policy and safe errors |
| `lib/normalize.ts` | Raw unknown JSON to stable normalized Match; exclusion decisions |
| `lib/types.ts` | Match feature schema, roles and routing mapping |
| `lib/metrics.ts` | Pure, testable metric calculations with documented denominators |
| `lib/insights.ts` | Sample-gated deterministic rules |
| `lib/demo.ts` | Fixed synthetic local fixture, independent of credentials |
| `components/dashboard.tsx` | Search state, shared filtering, navigation, cards and match details |
| `components/charts.tsx` | Accessible SVG time series and labeled champion bars |
| `app/globals.css` | Tailwind import, visual tokens, responsive layout and focus states |
| `tests/*.test.ts` | Metric, normalization, input and transport behavior tests |

The normalized record preserves champion, role, duration, timestamp, outcomes, K/D/A and raw activity counts. Future style clustering can derive per-minute features and split by role without changing API access. It would need substantially more data, consent/policy review, train/test discipline and clear limitations; no model is trained here.

## Verification

See `docs/verification.md` for the checks actually run. Live API verification requires a valid key and is separate from local fixture and mocked transport testing.
