import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RiotError } from "../lib/transport";
// All requests below are mocked locally. This is not a live Riot verification.
test("server integration: routing, partial results, cache, empty, skipped, and errors", async () => {
  process.env.RIOT_API_KEY = "mock-key-never-used-on-network";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let scenario = "partial";
  const urls: string[] = [];
  const fixture = JSON.parse(
    readFileSync(
      new URL("../docs/sanitized-match.json", import.meta.url),
      "utf8",
    ),
  );
  globalThis.fetch = (async (url: string | URL | Request) => {
    calls++;
    const address = String(url);
    urls.push(address);
    if (address.includes("/accounts/")) {
      if (scenario === "missing") return new Response("", { status: 404 });
      if (scenario === "invalid") return new Response("", { status: 403 });
      return Response.json({
        puuid: "SANITIZED_PUUID",
        gameName: "Example",
        tagLine: "NA1",
      });
    }
    if (address.includes("/ids?"))
      return Response.json(
        scenario === "empty"
          ? []
          : scenario === "skipped"
            ? ["KR_OTHER"]
            : ["NA1_GOOD", "NA1_BAD"],
      );
    if (address.endsWith("NA1_GOOD") && scenario !== "all-fail")
      return Response.json(fixture);
    return new Response("", { status: 404 });
  }) as typeof fetch;
  try {
    const { analyzeLive } = await import("../lib/riot");
    const [partial, same] = await Promise.all([
      analyzeLive("First", "NA1", "NA"),
      analyzeLive("First", "NA1", "NA"),
    ]);
    assert.equal(partial, same);
    assert.equal(calls, 4);
    assert.equal(partial.matches.length, 1);
    assert.equal(partial.failed, 1);
    assert.match(partial.notices[0], /partial results/);
    assert.equal(partial.mode, "live");
    await analyzeLive("First", "NA1", "NA");
    assert.equal(calls, 4);
    assert.ok(
      urls.every((url) =>
        url.startsWith("https://americas.api.riotgames.com/"),
      ),
    );
    assert.ok(urls.some((url) => url.endsWith("queue=420&start=0&count=20")));
    scenario = "empty";
    assert.equal((await analyzeLive("Empty", "KR1", "KR")).matches.length, 0);
    assert.ok(
      urls.some((url) => url.startsWith("https://asia.api.riotgames.com/")),
    );
    scenario = "skipped";
    assert.equal((await analyzeLive("Skipped", "NA1", "NA")).skipped, 1);
    scenario = "all-fail";
    await assert.rejects(
      analyzeLive("Failure", "NA1", "NA"),
      (e: RiotError) => e.status === 404,
    );
    scenario = "missing";
    await assert.rejects(
      analyzeLive("Missing", "NA1", "NA"),
      (e: RiotError) => e.status === 404,
    );
    scenario = "invalid";
    await assert.rejects(
      analyzeLive("Invalid", "NA1", "NA"),
      (e: RiotError) => e.status === 403,
    );
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.RIOT_API_KEY;
  }
});
