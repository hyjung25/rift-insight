import test from "node:test";
import assert from "node:assert/strict";
import { kda, perMinute, summarize, champions } from "../lib/metrics";
import { normalizeMatch } from "../lib/normalize";
import { recentPatterns } from "../lib/insights";
import { demoAnalysis } from "../lib/demo";
import { validateInput } from "../lib/validation";
import { routes, type Match } from "../lib/types";
const match: Match = {
  id: "NA1_1",
  champion: "Ahri",
  role: "MIDDLE",
  win: true,
  duration: 1200,
  startedAt: 1700000000000,
  kills: 8,
  deaths: 2,
  assists: 6,
  cs: 160,
  damage: 16000,
  vision: 20,
  excluded: null,
};
const raw = () => ({
  metadata: { matchId: "NA1_1" },
  info: {
    queueId: 420,
    gameDuration: 1200,
    gameStartTimestamp: 1700000000000,
    participants: [
      {
        puuid: "test",
        championName: "Ahri",
        teamPosition: "MIDDLE",
        win: true,
        kills: 8,
        deaths: 2,
        assists: 6,
        totalMinionsKilled: 150,
        neutralMinionsKilled: 10,
        totalDamageDealtToChampions: 16000,
        visionScore: 20,
      },
    ],
  },
});
test("weighted rates and aggregate KDA differ from means of ratios", () => {
  const stats = summarize([
    match,
    {
      ...match,
      win: false,
      duration: 2400,
      kills: 4,
      deaths: 6,
      assists: 2,
      cs: 200,
      damage: 20000,
      vision: 40,
    },
  ]);
  assert.equal(stats.count, 2);
  assert.equal(stats.winRate, 50);
  assert.equal(stats.cs, 6);
  assert.equal(stats.damage, 600);
  assert.equal(stats.vision, 1);
  assert.equal(stats.kda, 2.5);
  assert.equal(stats.kills, 6);
  assert.equal(stats.deaths, 4);
  assert.equal(stats.assists, 4);
});
test("zero deaths and empty datasets stay finite", () => {
  assert.equal(kda(5, 0, 7), 12);
  assert.equal(perMinute(10, 0), 0);
  for (const n of Object.values(summarize([]))) assert.equal(n, 0);
});
test("remakes, short games, and incomplete records do not affect aggregates", () => {
  assert.equal(
    summarize([
      match,
      { ...match, excluded: "remake" },
      { ...match, duration: 100 },
    ]).count,
    1,
  );
});
test("champion subsets consistently aggregate", () => {
  const rows = [match, { ...match, champion: "Syndra", win: false }];
  assert.equal(champions(rows)[0].count, 1);
  assert.equal(
    summarize(rows.filter((m) => m.champion === "Syndra")).winRate,
    0,
  );
});
test("normalizer combines lane and jungle CS and preserves unknown roles", () => {
  const dto = raw();
  dto.info.participants[0].teamPosition = "";
  const m = normalizeMatch(dto, "test")!;
  assert.equal(m.cs, 160);
  assert.equal(m.role, "UNKNOWN");
  assert.equal(m.excluded, null);
});
test("missing participant / wrong queue / malformed payload returns null", () => {
  assert.equal(normalizeMatch(raw(), "absent"), null);
  const dto = raw();
  dto.info.queueId = 450;
  assert.equal(normalizeMatch(dto, "test"), null);
  assert.equal(normalizeMatch(null, "test"), null);
});
test("missing or non-finite core values are excluded rather than treated as real zeros", () => {
  const dto = raw();
  const p = dto.info.participants[0] as Record<string, unknown>;
  delete p.visionScore;
  assert.equal(normalizeMatch(dto, "test")!.excluded, "Incomplete match data");
  p.visionScore = NaN;
  assert.ok(normalizeMatch(dto, "test")!.excluded);
});
test("short games, early surrender, and invalid durations are excluded", () => {
  const dto = raw();
  dto.info.gameDuration = 299;
  assert.match(normalizeMatch(dto, "test")!.excluded!, /under 5/);
  dto.info.gameDuration = 1200;
  Object.assign(dto.info.participants[0], { gameEndedInEarlySurrender: true });
  assert.ok(normalizeMatch(dto, "test")!.excluded);
  dto.info.gameDuration = 0;
  assert.equal(normalizeMatch(dto, "test")!.excluded, "Incomplete match data");
});
test("timestamps determine duration when both are present", () => {
  const dto = raw();
  Object.assign(dto.info, {
    gameEndTimestamp: dto.info.gameStartTimestamp + 1500000,
  });
  assert.equal(normalizeMatch(dto, "test")!.duration, 1500);
});
test("patterns have minimum samples and factual counts", () => {
  const matches = demoAnalysis().matches;
  assert.equal(recentPatterns(matches.slice(0, 4))[0].kind, "sample");
  assert.ok(
    !recentPatterns(matches.slice(0, 9)).some((p) => p.kind === "trend"),
  );
  const patterns = recentPatterns([...matches].reverse());
  assert.match(patterns[0].text, /Ahri in 8 of 20/);
  assert.ok(patterns.some((p) => p.kind === "trend"));
});
test("demo has a fixed identity, 20 synthetic matches, and 65% win rate", () => {
  const demo = demoAnalysis("NA");
  assert.equal(demo.mode, "demo");
  assert.equal(demo.riotId, "Rift Explorer#DEMO");
  assert.equal(demo.server, "NA");
  assert.equal(summarize(demo.matches).winRate, 65);
});
test("validation accepts Unicode Riot IDs and rejects invalid input", () => {
  assert.equal(
    validateInput({ riotId: "Hide on bush#KR1", server: "KR" }).gameName,
    "Hide on bush",
  );
  assert.equal(
    validateInput({ riotId: "플레이어#한국서버", server: "KR" }).tagLine,
    "한국서버",
  );
  for (const riotId of [
    "name",
    "a#abc",
    "name#x",
    "name#abc#def",
    "<script>#abc",
  ])
    assert.throws(() => validateInput({ riotId, server: "NA" }));
  assert.throws(() => validateInput({ riotId: "name#abc", server: "EU" }));
});
test("NA and KR use regional routes and platform-specific match prefixes", () => {
  assert.deepEqual(routes.NA, { region: "americas", platform: "NA1" });
  assert.deepEqual(routes.KR, { region: "asia", platform: "KR" });
});
