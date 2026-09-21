# Rift Insight

**[Open the public website](https://hyjung25.github.io/rift-insight/)** — interactive demo, no installation required. The public website uses labeled synthetic data; real player lookup remains available in the server application.

A focused League of Legends player analytics dashboard built with **Next.js App Router, TypeScript, React, and Tailwind CSS**. Enter a Riot ID, choose NA or KR, and analyze up to 20 recent ranked solo/duo games. The interface includes aggregate stats, champion performance, win-rate and CS/min charts, match details, consistent champion/role filters, and deterministic recent-pattern observations.

No authentication, database, chatbot, model training, or rank benchmarks. All statistics describe the retrieved, filtered sample—not the entire season.

## API overview (assignment summary)

Rift Insight uses JavaScript's built-in `fetch` with `async/await` inside a Next.js server route to call Riot's ACCOUNT-V1 and MATCH-V5 APIs. A Riot ID (`gameName#tagLine`) resolves to a PUUID, and the selected server determines regional routing: NA uses Americas and KR uses Asia. The match-list request supplies `queue=420`, `start=0`, and `count=20`, then the server retrieves each available match's details. Riot returns JSON objects and arrays containing strings, numbers, and booleans; TypeScript normalization extracts champion, role, result, duration, K/D/A, minions, damage, and vision for interactive statistics and charts. Authentication uses the server-only `RIOT_API_KEY` environment variable in the `X-Riot-Token` header, so the browser never receives the secret.

**Submission materials:** [AI prompt log](prompt_log.md) · [Portfolio copy, video guide, and checklist](docs/submission.md) · [Verification record](docs/verification.md)

Repository: https://github.com/hyjung25/rift-insight · [Portfolio project](https://hyjung25.github.io/#rift-insight)

## Choose how to use the app

| Mode | Where to open it | API key needed? | Data |
|---|---|---|---|
| Public website demo | [hyjung25.github.io/rift-insight](https://hyjung25.github.io/rift-insight/) | No | 20 fixed synthetic matches |
| Local demo | `http://localhost:3000` after setup below | No | The same synthetic fixtures |
| Local live search | `http://localhost:3000` with a configured server key | Yes | Up to 20 recent ranked solo/duo matches returned by Riot |

### Why live search currently runs locally

**Riot does not require every API application to run on localhost.** Local live search is the current deployment choice for this assignment, for three separate reasons:

1. **Key permissions:** this project's live testing used a development key. It does not authorize a public live-search service; a production application needs Riot's appropriate approval and production key. Moving the same development key to a cloud environment does not change its permitted use. See [Riot's API key policy](https://developer.riotgames.com/docs/portal#web-apis).
2. **Hosting capability:** the public site uses GitHub Pages, which serves static HTML, CSS, and JavaScript. It cannot execute this project's Next.js `/api/analyze` server route. Running `npm run dev` locally starts both the browser interface and that backend. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
3. **Secret protection:** the backend reads `RIOT_API_KEY` from `.env.local` and calls Riot on the user's behalf. Putting that key into static frontend JavaScript would expose it to visitors. A cloud backend can also keep a key private, but a static website alone cannot provide this server-side protection.

The local request path is **browser → local Next.js server → Riot → normalized results → browser**. The public demo instead reads synthetic fixtures inside the browser, so it needs neither an API key nor a running local server. It is an interactive demonstration of the interface, not evidence of a live API call; live verification is documented separately.

To offer real searches online later, obtain Riot production access, deploy the full Next.js app to a Node/server-capable host, configure the production key as a private server environment variable, and adapt the current per-process cache/limiter to the hosting architecture. Visitors would then use a public URL without installing anything locally. A production key by itself does not add backend support to GitHub Pages.

### 1. Use the public demo — no installation

1. Open **https://hyjung25.github.io/rift-insight/**. You can also select **Open App** on the [portfolio project](https://hyjung25.github.io/#rift-insight).
2. The dashboard starts with `Rift Explorer#DEMO`. The banner explicitly identifies the data as synthetic; this is not a real player's history.
3. Use **All champions** and **All roles** to filter the dashboard. The summary cards, champion breakdowns, charts, recent patterns, and match history update together. Use **Reset** to clear the filters.
4. Select **View all 20 matches**, then expand an individual match for damage and vision details. Open **How metrics are calculated** for the formulas and exclusions.
5. To reset the sample profile for a selected server label, choose **Korea (KR)** or **North America (NA)** and select **Explore demo**. The fixtures are the same for both selections; switching the label does not retrieve real regional matches.

**The public website does not support real Riot ID searches.** Its sample-player field is read-only, and it makes no authenticated Riot API requests. GitHub Pages hosts static files and cannot run the Next.js API backend. Public live search would require server hosting and Riot production access; the private development key is not included in the deployed site.

### 2. Install and run locally

Install Node.js 20.9 or newer (Node 24 LTS recommended), npm, and Git. Then run:

```sh
git clone https://github.com/hyjung25/rift-insight.git
cd rift-insight
npm ci
npm run dev
```

Open **http://localhost:3000** and keep the terminal running. Stop the server with **Ctrl+C**. If you already have the source, run these npm commands from the directory containing `package.json` instead of cloning again.

**Local demo:** no key or `.env.local` file is needed. With no key configured, the app opens the labeled 20-match demo automatically. Its filters, charts, and expandable history work just like the public demo. The search form in the local app is for live lookups; without a key, submitting a real Riot ID shows a configuration error. Select **Explore demo data** to return to the sample dashboard.

If a key is already configured, the local app opens with a search screen; select **Explore the demo** to use fixtures explicitly. To make demo mode the startup default again, remove or comment out the `RIOT_API_KEY` entry in `.env.local` and restart the server. A failed live request never silently substitutes demo data.

### 3. Enable real Riot API lookups locally

1. Sign in to the [Riot Developer Portal](https://developer.riotgames.com/) and obtain a development API key. Riot development keys deactivate every 24 hours; regenerate yours if it expires. These keys are for local/private development, not a public live service. See [Riot's key requirements](https://developer.riotgames.com/docs/portal).
2. Stop the running local server with **Ctrl+C**. On the first setup, copy the example environment file:

   ```sh
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`. If `.env.local` already exists, edit it directly rather than overwriting it.

3. Open `.env.local` in your editor and replace the placeholder with your own key:

   ```dotenv
   RIOT_API_KEY=your_riot_api_key_here
   ```

4. Save the file and restart with `npm run dev`. Open **http://localhost:3000**.
5. Enter the player's Riot ID as **gameName#tagLine**, choose the actual server (**NA** or **KR**), and select **Analyze player**. For example, `Hide on bush#KR1` uses **Korea (KR)**. The dashboard displays the returned identity, number of analyzed matches, and any partial-result notices.

The key is used only by the Next.js server in the `X-Riot-Token` header. Never use a `NEXT_PUBLIC_` environment variable for it or put it in browser code. `.env.local` is excluded by `.gitignore`; only the placeholder `.env.example` belongs in Git. Do not paste keys into the README, screenshots, videos, or chat. `lib/riot.ts` imports `server-only` to prevent accidental client imports.

**Troubleshooting:**

- **“Live lookups need RIOT_API_KEY”**: confirm `.env.local` is next to `package.json`, replace the placeholder, save, and restart.
- **“Invalid or expired” / rejected key**: generate a fresh key, update `.env.local`, and restart. Restarting alone does not renew an expired key.
- **Account not found**: check both the game name and tag, and select the correct server.
- **No matches**: the app only analyzes recent ranked solo/duo games (queue 420) on the selected server.
- **Rate limit**: wait for the displayed retry interval; avoid repeated searches while waiting.

### Local checks and production-style server

Run the checks from the project directory:

```sh
npm test
npm run typecheck
npm run build
```

To run the compiled server locally, stop the development server and run `npm start`, then open **http://localhost:3000**. This still uses your local server configuration; it does not publish a website. For the credential-free public build, see [Public website deployment](#public-website-deployment).

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

## Riot API access conditions and attribution

The following summarizes the conditions relevant to this project, checked **September 21, 2026**. The linked official policies remain authoritative and may change.

### API key types

| Key | Intended use | Conditions relevant to Rift Insight |
|---|---|---|
| Development | Prototyping and testing | Generated through the developer portal; deactivates every 24 hours. Regenerate it for continued testing. Not for a publicly available live application. |
| Personal | Individual use or a small private community | Requires product registration and a description. Standard APIs only; no Tournaments API or rate-limit increases. Cannot power public access, including open alpha/beta testing. |
| Production | A service offered to players publicly | Apply through product registration; Riot reviews the project, typically using a working prototype. Approval is not automatic. Use one product per production key. |

A free school project is not automatically exempt from public-use restrictions. A public source repository and a publicly accessible keyed service are different: publishing this source does not publish its local secret. Source: [Riot developer portal — key types](https://developer.riotgames.com/docs/portal#web-apis).

### Request limits and failures

Riot documents personal-key limits of 20 requests/second and 100 requests/2 minutes per region. Application, method, and service limits may all apply. On HTTP 429, pause for `Retry-After`; do not keep retrying immediately. Invalid/expired keys must be corrected rather than repeatedly retried. The app's concurrency limit, pacing, caching, and bounded retries implement this behavior. Source: [Riot rate limits and response codes](https://developer.riotgames.com/docs/portal#rate-limiting).

### Product registration, security, and permitted use

- Register the product with Riot and keep its description/features current for review. The League policy requires registration for products serving players even when they do not use documented APIs. A fixture-only demo does not establish Riot approval or remove applicable registration/IP requirements. **This repository does not claim that Riot registration or production approval has been completed.** [General registration policy](https://developer.riotgames.com/policies/general), [League registration policy](https://developer.riotgames.com/docs/lol#developer-api-policy).
- Access Riot over HTTPS and keep API keys out of source code and browser bundles. This app uses a server environment variable; `.env.local` is ignored by Git. Rotate an exposed key; removing a committed secret from the newest revision does not remove earlier history. [Riot security requirements](https://developer.riotgames.com/policies/general#developer-safety).
- Use supported APIs and respect game integrity: no unfair competitive advantage, de-anonymization of hidden players, or unofficial MMR/ELO replacement. This project shows retrospective match statistics and sample-based observations. [Riot general policies](https://developer.riotgames.com/policies/general).
- Use permitted assets and display Riot's non-endorsement notice. Rift Insight uses official Data Dragon champion portraits/splash art and shows the notice in its footer; it does not use a Riot corporate logo. Bundled portraits use version `16.18.1`, with a text fallback for unavailable images. See [Data Dragon documentation](https://developer.riotgames.com/docs/lol#data-dragon) and [`public/assets/ATTRIBUTION.md`](public/assets/ATTRIBUTION.md).

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

## Public website deployment

The public dashboard is hosted at **https://hyjung25.github.io/rift-insight/** on GitHub Pages. It preserves interactive filters, charts, match details, and sample-gated observations, but uses explicit synthetic fixtures. It does not offer live Riot ID lookup or transmit credentials. The portfolio links directly to the app.

`npm run build:demo` builds the same dashboard in an isolated `.demo-build` directory with Next.js static export and `/rift-insight` as its base path. The script copies an explicit allowlist of UI, metric, fixture, and asset files; it excludes `.env` files and server API modules, strips `RIOT_API_KEY` from the build process environment, and generates a static page with `publicDemo` enabled. It does not modify the normal server app or its `.next` output. Deploy the contents of `.demo-build/out` (including `.nojekyll`) to the repository's `gh-pages` branch, which GitHub Pages serves from its root. Pushing source changes to `main` alone does not rebuild that branch; rerun the demo build and publish the output when changing the hosted dashboard.

For future public live search, deploy the normal Next.js application to a host that supports Node server routes and configure an approved Riot production key in the host's private environment. GitHub Pages cannot run `/api/analyze`. Development/personal keys must not power a public live service. The local server integration remains fully functional and was verified independently with a live KR lookup.
