import { NextRequest, NextResponse } from "next/server";

import { getBrowser } from "@/services/invoice/server/browser";
import { getClientKey, rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Warms the shared Chromium instance.
 *
 * Launching Chromium costs roughly 2.3s, and on a cold serverless instance the
 * user pays all of it on their first Generate — the slowest possible moment to
 * be surprised. The client pings this on mount, so the launch overlaps with
 * filling in the form and the first real request finds a warm browser.
 *
 * Fire-and-forget by design: it reports success or failure and does nothing
 * else, so a failed warm degrades to today's behaviour rather than breaking
 * anything.
 */
export async function GET(req: NextRequest) {
    // Cheap for us, but it does start a browser — so it is not a free endpoint
    // to hammer.
    const limited = rateLimit(`warm:${getClientKey(req)}`, 10, 60_000);

    if (!limited.allowed) {
        return NextResponse.json(
            { error: "Too many requests" },
            {
                status: 429,
                headers: { "Retry-After": String(limited.retryAfterSeconds) },
            }
        );
    }

    try {
        await getBrowser();
        return NextResponse.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("Browser warm-up failed:", error);
        // 200, not 500: the warm-up is an optimisation. A failure here must not
        // surface to the user as an error, and generation will retry the launch.
        return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
    }
}
