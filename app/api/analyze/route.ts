import { NextResponse } from "next/server";
import { validateInput } from "@/lib/validation";
import { demoAnalysis } from "@/lib/demo";
import { analyzeLive } from "@/lib/riot";
import { RiotError } from "@/lib/transport";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1024)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    let input;
    try {
      input = validateInput(JSON.parse(body));
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof SyntaxError
              ? "Invalid request body."
              : (error as Error).message,
        },
        { status: 400 },
      );
    }
    const result = input.demo
      ? demoAnalysis(input.server)
      : await analyzeLive(input.gameName, input.tagLine, input.server);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const known = error instanceof RiotError;
    return NextResponse.json(
      {
        error: known
          ? error.message
          : "The lookup could not be completed. Please try again.",
        retryAfter: known ? error.retryAfter : undefined,
      },
      {
        status: known
          ? error.status === 401 || error.status === 403
            ? 503
            : error.status
          : 500,
        headers:
          known && error.retryAfter
            ? { "Retry-After": String(error.retryAfter) }
            : undefined,
      },
    );
  }
}
