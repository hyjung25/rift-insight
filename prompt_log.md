# AI assistance / prompt log

## Tools used

- **OpenAI Codex coding assistant:** implementation, debugging, tests, and documentation. The exact model version was not independently recorded.
- **Web research tool:** checked Riot's official account/match API documentation, routing, key requirements, rate limits, and Data Dragon usage.
- **Local terminal and Node.js/npm:** installed dependencies, ran TypeScript checks, built the Next.js app, and ran tests.
- **Playwright with local Chrome:** verified desktop/mobile interactions, captured screenshots, and recorded a captioned live demonstration. The Codex in-app browser connection was unavailable in this session, so local Chrome was used instead.

No AI model runs inside the app. “Recent patterns” uses deterministic, sample-gated TypeScript rules, not generated coaching or ML predictions.

## Key prompts that shaped the project

These are concise excerpts or summaries, not the entire conversation.

1. **Initial specification:** “Build a polished League of Legends player analytics web app called ‘Rift Insight.’” Use Next.js, TypeScript, and Tailwind; check official Riot documentation; resolve a Riot ID for NA/KR and retrieve up to 20 ranked solo/duo matches.
2. **Analytics and scope:** Add win rate, K/D/A, KDA, CS/min, champion damage/min, vision/min, champion breakdowns, match history, two charts, and consistent champion/role filters. Explain metrics and exclude remakes/incomplete records appropriately. Keep the implementation understandable for a university API assignment and suitable for a portfolio.
3. **Security and resilience:** Call Riot only from the server, keep `RIOT_API_KEY` private, validate inputs, use bounded concurrency/caching/retries, show partial failures, and offer explicitly labeled local demo fixtures without silently replacing failed live requests.
4. **Verification:** Run the build and type checks, test metric edge cases, verify demo interactions, and distinguish those checks from live API testing.
5. **Troubleshooting:** After the app reported an invalid or expired key, restart and verify server configuration and Riot authentication. A replacement key enabled a successful live KR lookup. Credentials are intentionally omitted from this log.
6. **Submission preparation:** Apply the assignment requirements for a GitHub repository, a 3–5 sentence API explanation, local setup/authentication instructions, a short AI prompt log, portfolio entry, demonstration video, and submission form.

7. **Public website:** The user requested a website accessible without a local server. Added an explicit, credential-free GitHub Pages demo built from the same dashboard and linked it from the portfolio; preserved the separate Next.js server application for live Riot lookups.

## Division of work

The user supplied the product requirements and assignment rubric, obtained Riot API access, and reported runtime errors. Codex generated and revised the implementation, documentation, and tests, and performed the recorded local checks. Review the code and metric definitions before presenting; this log does not claim that generated code was written manually or that an AI model was trained.
