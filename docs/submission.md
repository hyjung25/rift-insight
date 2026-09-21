# Rift Insight submission kit

## Deliverables and status

- [x] Working Next.js/TypeScript app with a server-side public API integration.
- [x] README with a five-sentence API overview, key setup, dependencies, and run commands.
- [x] AI tool and key prompt log in `prompt_log.md`.
- [x] Build, type checks, 21 automated tests, and desktop/mobile checks recorded.
- [x] A live KR lookup returned 20 matches without failed requests.
- [x] Publish the project to the public GitHub repository: https://github.com/hyjung25/rift-insight
- [x] Push the project card to the public portfolio repository: https://github.com/hyjung25/hyjung25.github.io (commit 170844b).
- [x] Record a 64-second captioned live demonstration (local artifact).
- [ ] Upload a short demonstration video to YouTube or Google Drive.
- [ ] Verify the video link in an incognito window.
- [ ] Submit repository/portfolio/video links through the course Google form before the course deadline.

Chosen repository: https://github.com/hyjung25/rift-insight

Portfolio project: https://hyjung25.github.io/#rift-insight

Portfolio video page: https://hyjung25.github.io/rift-insight-demo.html

The portfolio-hosted recording is accessible without signing in. The assignment specifically requests a YouTube or Google Drive video link, so uploading there and checking anonymous access remain submission steps. No form submission is claimed.

## Ready-to-use portfolio entry

**Title:** Rift Insight — League of Legends Player Analytics

**Description:** An interactive dashboard that turns recent ranked League of Legends matches into a clear view of player performance. Search a Riot ID, filter by champion or role, and explore win rates, farming trends, and match history. Built with Next.js, TypeScript, Tailwind CSS, and Riot's public API, with server-side authentication, caching, bounded retries, and an explicit demo mode.

**Engineering highlights:** Separated API access, normalization, metric calculations, deterministic insights, and UI; 21 automated tests; responsive desktop/mobile dashboard; successful live KR lookup.

**Tags:** Next.js · TypeScript · React · Tailwind CSS · REST APIs · Data visualization · Testing

**Links to add:** GitHub repository; demonstration video; optional hosted demo.

**Image:** `docs/dashboard-preview.png`

This project does not train an ML model or use an AI coach. It creates a normalized dataset structure that could support future experiments.

For a portfolio's public live demo, use the explicitly labeled fixture mode without a key until Riot's production requirements are met. A private/local development key must not be deployed for public access. The existing Next.js server route is the backend that addresses the assignment's warning about keyed browser JavaScript: browser code calls `/api/analyze`; only the server contacts Riot with the key.

## Recorded demonstration

The user-recorded `15113HW3.webm` is the primary demonstration, approximately 1 minute 42 seconds long. It is linked from the portfolio and README at https://hyjung25.github.io/rift-insight-demo.html . The uploaded copy has repaired duration/seek metadata without re-encoding the audio or video; the original local file is unchanged.

A 64-second, 1440×1000 captioned WebM recording is saved locally at `artifacts/rift-insight-demo.webm` (excluded from Git). It shows a real KR lookup, summary statistics, charts, a champion filter, deterministic patterns, expanded match details, and metric definitions. It has on-screen explanations and no audio, and does not show credentials. Upload this file to YouTube or Google Drive for the required shareable video link; the local file itself is not a submission URL.

## Suggested 60–90 second video walkthrough

1. **0–10 seconds — Introduce the project.** “This is Rift Insight, a League of Legends player analytics app using Riot's public API. These statistics describe the retrieved recent matches, not an entire season.”
2. **10–25 seconds — Show the lookup.** Enter a public Riot ID with its correct server and click Analyze player. Show the returned identity and match count. If using the demo, explicitly say it is synthetic fixture data; do not describe it as live.
3. **25–45 seconds — Demonstrate interaction.** Point out win rate and KDA, then choose a champion. Show the count, summary cards, and both charts changing together. Choose a role, then reset the filters.
4. **45–60 seconds — Inspect a match.** Expand a match card to show damage and vision values, then open “How metrics are calculated.” Explain that short matches/remakes and incomplete records are excluded.
5. **60–80 seconds — Explain the integration.** “A Next.js server route resolves the Riot ID to a PUUID, fetches queue 420 match IDs, and retrieves details. Riot returns JSON. The API key stays in a local environment file and never goes into browser code or GitHub.”
6. **80–90 seconds — Close.** “The project includes setup instructions, an AI prompt log, and tested calculations. Demo mode lets a grader explore it without a key.”

Record the browser window only. Do not show `.env.local`, terminal commands containing credentials, or the developer portal's key. The video can be a simple screen recording; narration is optional if the interactions and mode labels are clear.

## Final submission checklist

1. Regenerate any key shared in chat and replace it privately in `.env.local`.
2. Confirm `.env.local`, `.next/`, and `node_modules/` are ignored. Only `.env.example` should be published, with a placeholder.
3. Review the files proposed for commit and verify no credential appears in repository history. If a key was ever committed, revoke it immediately; deleting the latest copy does not erase history.
4. Publish the selected repository with access that permits grading.
5. Add the portfolio entry and working links.
6. Upload the demonstration video. Use an unlisted YouTube link or Google Drive “Anyone with the link” viewer access, as allowed by the assignment. Open the final link while signed out/incognito.
7. Fill out the [course submission form](https://forms.gle/oExGPXys7uyZkh2M7) with the actual repository and video URLs. Confirm the submission succeeded. The due date was not provided in this conversation; use the course's deadline.
