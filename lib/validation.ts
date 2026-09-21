import type { Server } from "./types";
export function validateInput(value: unknown): {
  gameName: string;
  tagLine: string;
  server: Server;
  demo: boolean;
} {
  if (!value || typeof value !== "object")
    throw new Error("Enter a Riot ID and select NA or KR.");
  const v = value as Record<string, unknown>;
  if (v.server !== "NA" && v.server !== "KR")
    throw new Error("Select a supported server: NA or KR.");
  if (typeof v.riotId !== "string" || v.riotId.length > 30)
    throw new Error("Enter a Riot ID as gameName#tagLine.");
  const parts = v.riotId.trim().split("#");
  if (parts.length !== 2)
    throw new Error(
      "Include both your game name and tag, for example Hide on bush#KR1.",
    );
  const [gameName, tagLine] = parts.map((s) => s.trim());
  if (
    [...gameName].length < 3 ||
    [...gameName].length > 16 ||
    !/^[\p{L}\p{N} _.'-]+$/u.test(gameName) ||
    !/^[\p{L}\p{N}]{3,5}$/u.test(tagLine)
  )
    throw new Error(
      "Use a 3–16 character game name and a 3–5 letter or number tag.",
    );
  return { gameName, tagLine, server: v.server, demo: v.demo === true };
}
