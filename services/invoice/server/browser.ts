import type { Browser } from "puppeteer-core";

// Variables
import { ENV } from "@/lib/variables";

/**
 * Shared headless-Chromium instance.
 *
 * PDF generation used to launch a browser and tear it down again on every
 * request, which dominated the request time (seconds, not milliseconds).
 * Chromium is expensive to start but cheap to open a page in, so the browser
 * is kept alive across requests and only pages are created and closed.
 *
 * The launch is memoised as a promise so concurrent requests arriving during
 * a cold start share one launch rather than each starting their own.
 */
let browserPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
    if (ENV === "production") {
        const chromium = (await import("@sparticuz/chromium")).default;
        const puppeteer = (await import("puppeteer-core")).default;

        return puppeteer.launch({
            // `--ignore-certificate-errors` was removed: it disabled TLS
            // verification for everything the browser fetched.
            args: [...chromium.args, "--disable-dev-shm-usage"],
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    }

    // Dev uses the full `puppeteer` package, which ships its own Chromium.
    const puppeteer = (await import("puppeteer")).default;
    return puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
    }) as unknown as Promise<Browser>;
}

function isAlive(browser: Browser): boolean {
    // `connected` is the modern property; fall back for older typings.
    if (typeof browser.connected === "boolean") return browser.connected;
    if (typeof browser.isConnected === "function") return browser.isConnected();
    return false;
}

/**
 * Returns the shared browser, launching or relaunching it as needed.
 *
 * A browser that has crashed or been killed externally is discarded and
 * replaced rather than handed out in a dead state.
 */
export async function getBrowser(): Promise<Browser> {
    if (browserPromise) {
        try {
            const existing = await browserPromise;
            if (isAlive(existing)) {
                return existing;
            }
        } catch {
            // Previous launch failed — fall through and retry below.
        }
        browserPromise = null;
    }

    browserPromise = launchBrowser().catch((error) => {
        // Don't cache a rejected promise, or every later request inherits it.
        browserPromise = null;
        throw error;
    });

    const browser = await browserPromise;

    browser.once("disconnected", () => {
        browserPromise = null;
    });

    return browser;
}

/** Closes the shared browser. Used on shutdown and by tests. */
export async function closeBrowser(): Promise<void> {
    if (!browserPromise) return;

    const pending = browserPromise;
    browserPromise = null;

    try {
        const browser = await pending;
        await browser.close();
    } catch {
        // Already gone.
    }
}
