# Verification record

Verified September 21, 2026 with Node 24.14.0 and Next.js 16.3.5.

## Passed

- `npm run build`: optimized production build, all app routes compiled successfully.
- `npm run typecheck`: strict TypeScript, no errors.
- `npm test`: 21 passing tests covering weighted rates, zero deaths, empty data, short games, remakes, missing values, role normalization, Unicode input, sample thresholds, routing, retries, rate-limit cooldowns, concurrency, cache reuse, partial failures, skipped records, empty results, missing accounts and invalid keys.
- Production app checked in headless Chrome at 1440 × 1100 and 390 × 844.
- Initial labeled demo: 20 matches, 65% win rate; official local images load.
- Champion filter: Ahri yields eight games and a matching chart subset.
- Combined champion and jungle-role filter: honest empty state, no summary cards.
- Clear filters restores the full sample.
- View all displays all 20 matches; individual match details expand.
- Champion and overview navigation switch visible sections correctly.
- Invalid Riot ID displays validation feedback.
- A valid live lookup without a configured key displays a configuration error and no stale player dashboard; it does not substitute demo data.
- Explicit demo action recovers the fixture dashboard.
- About dialog opens and closes with Escape.
- Narrow layout has no horizontal document overflow; match dates remain visible.
- Direct demo API POST supports NA; unsupported region returns 400.
- Final browser run reported no uncaught page errors or hydration errors.

Screenshots: `dashboard-desktop.png`, `dashboard-mobile.png`, and `dashboard-preview.png`.

## Test boundaries

**Live KR verification subsequently passed:** after configuring a valid key, a POST through the running app for `Hide on bush#KR1` returned HTTP 200, `mode: live`, 20 retrieved and eligible matches, zero failed requests, zero skipped records, and no notices. The earlier missing-key and rejected-key states were also exercised. NA routing is covered by mocked tests; live NA lookup has not been verified.

Automated server integration tests still replace fetch with local responses and use an obviously fake test-only key; they make no external requests. The JSON response example is synthetic and sanitized, not a live capture. No API key is included in this record.

The in-app browser tool could not initialize in this environment. Verification used temporary Playwright with the locally installed Chrome instead. The app's bundled Node could not load macOS native build modules, so builds and checks used a temporary official Node 24 runtime. Neither workaround changes the project's standard Node/npm setup.

Public deployment is not performed. Before exposing live access, obtain Riot production approval and address the per-process cache/limiter limitation documented in the README.
