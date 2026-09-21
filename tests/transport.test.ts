import test from "node:test";
import assert from "node:assert/strict";
import { createTransport, retryDelay, RiotError } from "../lib/transport";
const ok = () => new Response(JSON.stringify({ value: 1 }));
test("parses Retry-After seconds and HTTP dates", () => {
  assert.equal(retryDelay("5"), 5000);
  assert.equal(retryDelay("Thu, 01 Jan 1970 00:00:10 GMT", 5000), 5000);
  assert.equal(retryDelay(null), 1000);
});
test("API authentication is passed as a header", async () => {
  const transport = createTransport((async (url, options) => {
    assert.equal(url, "https://example.test/");
    assert.equal(
      (options?.headers as Record<string, string>)["X-Riot-Token"],
      "test-key",
    );
    return ok();
  }) as typeof fetch);
  assert.deepEqual(await transport("https://example.test/", "test-key"), {
    value: 1,
  });
});
test("does not retry invalid keys, missing accounts, or malformed JSON", async () => {
  for (const status of [401, 403, 404]) {
    let calls = 0;
    const request = createTransport((async () => {
      calls++;
      return new Response("", { status });
    }) as typeof fetch);
    await assert.rejects(
      request("https://example.test", "test"),
      (e: RiotError) => e.status === status,
    );
    assert.equal(calls, 1);
  }
  const request = createTransport(
    (async () => new Response("not json")) as typeof fetch,
  );
  await assert.rejects(
    request("https://example.test", "test"),
    (e: RiotError) => e.status === 502,
  );
});
test("transient failures retry at most twice", async () => {
  let calls = 0;
  const request = createTransport(
    (async () => {
      calls++;
      return new Response("", { status: 503 });
    }) as typeof fetch,
    async () => {},
  );
  await assert.rejects(request("https://example.test", "test"));
  assert.equal(calls, 3);
});
test("long Retry-After is surfaced, never shortened for an early retry", async () => {
  let calls = 0;
  const request = createTransport(
    (async () => {
      calls++;
      return new Response("", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }) as typeof fetch,
    async () => {
      assert.fail("Must not sleep then retry early");
    },
  );
  await assert.rejects(
    request("https://example.test", "test"),
    (e: RiotError) => e.retryAfter === 60,
  );
  await assert.rejects(request("https://example.test", "test"));
  assert.equal(calls, 1);
});
test("a successful retry returns parsed data", async () => {
  let calls = 0;
  const request = createTransport(
    (async () =>
      ++calls === 1 ? new Response("", { status: 503 }) : ok()) as typeof fetch,
    async () => {},
  );
  assert.deepEqual(await request("https://example.test", "test"), { value: 1 });
  assert.equal(calls, 2);
});
test("concurrency never exceeds three even across independent callers", async () => {
  let active = 0,
    max = 0;
  const request = createTransport(
    (async () => {
      active++;
      max = Math.max(max, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return ok();
    }) as typeof fetch,
    async () => {},
  );
  await Promise.all(
    Array.from({ length: 12 }, () => request("https://example.test", "test")),
  );
  assert.equal(max, 3);
});
