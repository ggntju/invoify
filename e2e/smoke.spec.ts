import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke tests — a tripwire, not coverage.
 *
 * Each of these asserts something a type checker cannot: that the app renders,
 * that state changes do not loop, that the layout does not overflow, and that
 * the PDF endpoint still returns a PDF.
 */

/**
 * Requests that legitimately fail outside a Vercel deployment.
 *
 * The analytics script is injected by @vercel/analytics and is only served by
 * Vercel's edge, so it 404s on any local or CI run. Allow-listing it by URL
 * keeps the assertion strict about everything else, rather than the easier and
 * much worse option of ignoring 404s in general.
 */
const EXPECTED_FAILING_REQUESTS = [/\/_vercel\/insights\//];

/**
 * Records console errors and failed requests.
 *
 * This is the check that would have caught round 2's render loop: React logs
 * "Maximum update depth exceeded" as a console error while the page is
 * otherwise still serving HTML, so an HTTP-level check sees nothing wrong.
 *
 * "Failed to load resource" console messages are dropped because the browser
 * reports them without a URL — the network listener below catches the same
 * failures and can say which request it was.
 */
function collectProblems(page: Page, problems: string[]) {
    page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (text.includes("Failed to load resource")) return;
        problems.push(`console: ${text}`);
    });

    page.on("pageerror", (err) => problems.push(`pageerror: ${err}`));

    page.on("response", (res) => {
        if (res.status() < 400) return;
        const url = res.url();
        if (EXPECTED_FAILING_REQUESTS.some((re) => re.test(url))) return;
        problems.push(`http ${res.status()}: ${url}`);
    });
}

/** Measures every element that sticks out past the viewport horizontally. */
async function horizontalOverflow(page: Page) {
    return page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const offenders: { tag: string; cls: string; right: number }[] = [];

        document.querySelectorAll<HTMLElement>("*").forEach((el) => {
            // Elements that scroll horizontally on purpose are allowed to be
            // wider than the viewport — that is what the scroller is for.
            const style = getComputedStyle(el);
            if (style.overflowX === "auto" || style.overflowX === "scroll") return;
            if (el.closest("[data-allow-x-overflow]")) return;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            if (rect.right > docWidth + 1) {
                offenders.push({
                    tag: el.tagName.toLowerCase(),
                    cls: el.className?.toString().slice(0, 80) ?? "",
                    right: Math.round(rect.right - docWidth),
                });
            }
        });

        return { docWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
    });
}

test.describe("invoice builder", () => {
    test("renders without page problems", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator('input[name="sender.name"]')).toBeVisible();

        // Give any render loop a chance to announce itself.
        await page.waitForTimeout(1500);
        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("typing persists a draft without errors", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        const name = page.locator('input[name="sender.name"]');
        await name.fill("Alexandria Consulting Group");
        await expect(name).toHaveValue("Alexandria Consulting Group");

        // Past the autosave debounce.
        await page.waitForTimeout(1200);
        const draft = await page.evaluate(() =>
            window.localStorage.getItem("invoify:invoiceDraft")
        );
        expect(draft, "draft should be written after the debounce").toBeTruthy();
        expect(draft!).toContain("Alexandria Consulting Group");

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("every wizard step renders without horizontal overflow", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");

        const dots = page.locator('nav[aria-label] ol button');
        const count = await dots.count();
        expect(count).toBe(5);

        for (let i = 0; i < count; i++) {
            await dots.nth(i).click();
            await page.waitForTimeout(250);

            const { offenders, scrollWidth, docWidth } = await horizontalOverflow(page);
            expect(
                offenders,
                `step ${i + 1} overflows horizontally: ${JSON.stringify(offenders, null, 2)}`
            ).toEqual([]);
            expect(scrollWidth, `step ${i + 1} document scrolls sideways`).toBeLessThanOrEqual(
                docWidth + 1
            );
        }

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("template gallery opens and switches template", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        await page.locator('nav[aria-label] ol button').nth(1).click();

        await page.getByRole("button", { name: /change template/i }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // 13 layouts, each a pressable card.
        const cards = dialog.locator('button[aria-pressed]').filter({ hasText: /./ });
        await expect(cards.first()).toBeVisible();

        await dialog.getByText("Sidebar", { exact: true }).click();
        await expect(dialog).toBeHidden();

        await page.waitForTimeout(500);
        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("generate endpoint returns a real PDF", async ({ request }) => {
        const res = await request.post("/api/invoice/generate?locale=en", {
            data: SAMPLE_INVOICE,
        });

        expect(res.status(), await res.text().catch(() => "")).toBe(200);
        expect(res.headers()["content-type"]).toContain("application/pdf");

        const body = await res.body();
        // Magic bytes, not just a non-empty response — a JSON error body has a
        // non-zero length too, which is exactly how a broken generation once
        // reported itself as a success.
        expect(body.subarray(0, 5).toString()).toBe("%PDF-");
        expect(body.length).toBeGreaterThan(5000);
    });

    test("identical invoices are served from cache", async ({ request }) => {
        // Unique so this test does not depend on what other tests generated.
        const invoice = {
            ...SAMPLE_INVOICE,
            details: { ...SAMPLE_INVOICE.details, invoiceNumber: "CACHE-1" },
        };

        const first = await request.post("/api/invoice/generate?locale=en", {
            data: invoice,
        });
        expect(first.status()).toBe(200);

        const second = await request.post("/api/invoice/generate?locale=en", {
            data: invoice,
        });
        expect(second.status()).toBe(200);
        expect(second.headers()["x-pdf-cache"]).toBe("hit");

        // A cache hit must return the same bytes, not merely a fast response.
        expect(await second.body()).toEqual(await first.body());
    });

    test("concurrent generations do not share a page", async ({ request }) => {
        // The renderer reuses one Chromium page behind a lock. Without the lock
        // two requests would race on a single document and the second would
        // print the first one's invoice.
        const make = (name: string, template: number) => ({
            ...SAMPLE_INVOICE,
            sender: { ...SAMPLE_INVOICE.sender, name },
            details: {
                ...SAMPLE_INVOICE.details,
                invoiceNumber: `RACE-${name}`,
                pdfTemplate: template,
            },
        });

        const [a, b] = await Promise.all([
            request.post("/api/invoice/generate?locale=en", { data: make("Alpha Corp", 1) }),
            request.post("/api/invoice/generate?locale=en", { data: make("Beta Industries", 7) }),
        ]);

        expect(a.status()).toBe(200);
        expect(b.status()).toBe(200);

        const [bodyA, bodyB] = [await a.body(), await b.body()];
        expect(bodyA.subarray(0, 5).toString()).toBe("%PDF-");
        expect(bodyB.subarray(0, 5).toString()).toBe("%PDF-");
        expect(bodyA.equals(bodyB)).toBe(false);
    });

    test("warm endpoint reports the renderer is ready", async ({ request }) => {
        const res = await request.get("/api/invoice/warm");
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual({ ready: true });
    });
});

const SAMPLE_INVOICE = {
    sender: {
        name: "John Doe",
        address: "123 Main St",
        zipCode: "12345",
        city: "Anytown",
        country: "USA",
        email: "johndoe@example.com",
        phone: "123-456-7890",
    },
    receiver: {
        name: "Jane Smith",
        address: "456 Elm St",
        zipCode: "54321",
        city: "Other Town",
        country: "Canada",
        email: "janesmith@example.com",
        phone: "987-654-3210",
    },
    details: {
        invoiceLogo: "",
        invoiceNumber: "INV0001",
        invoiceDate: "2026-01-15T00:00:00.000Z",
        dueDate: "2026-02-15T00:00:00.000Z",
        items: [
            { name: "Product 1", description: "A thing", quantity: 4, unitPrice: 50, total: 200 },
        ],
        currency: "USD",
        language: "English",
        taxDetails: { amount: 15, amountType: "percentage", taxID: "987654321" },
        discountDetails: { amount: 5, amountType: "percentage" },
        shippingDetails: { cost: 5, costType: "percentage" },
        paymentInformation: {
            bankName: "Bank Inc.",
            accountName: "John Doe",
            accountNumber: "445566998877",
        },
        additionalNotes: "Thank you for your business",
        paymentTerms: "Net 30",
        subTotal: 200,
        totalAmount: 200,
        totalAmountInWords: "Two Hundred",
        pdfTemplate: 1,
        theme: { accentColor: "#4F46E5", fontId: "outfit", density: "comfortable" },
    },
};
