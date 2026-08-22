import React from "react";
import { NextRequest, NextResponse } from "next/server";

// Next Intl
import { getMessages } from "@/i18n/messages";

// Invoice document labels
import { buildInvoiceLabels } from "@/app/components/templates/invoice-pdf/invoiceLabels";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

// Variables
import { DEFAULT_LOCALE, LOCALES } from "@/lib/variables";

/** Only known locales are accepted; anything else falls back to the default. */
function resolveLocale(requested: string | null): string {
    if (requested && LOCALES.some((locale) => locale.code === requested)) {
        return requested;
    }
    return DEFAULT_LOCALE;
}

// Validation
import { InvoiceSchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/server/validateRequest";

// Generated stylesheet
import { PDF_TAILWIND_CSS } from "@/lib/pdfStyles.generated";

// Browser
import { getBrowser } from "./browser";

// Types
import { InvoiceType } from "@/types";

/**
 * Generate a PDF document of an invoice based on the provided data.
 *
 * @async
 * @param {NextRequest} req - The Next.js request object.
 * @throws {Error} If there is an error during the PDF generation process.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object containing the generated PDF.
 */
export async function generatePdfService(req: NextRequest) {
    // Client-side zod validation is bypassable by calling this route directly,
    // so the body is re-validated (and size-capped) here.
    const parsed = await parseJsonBody(req, InvoiceSchema);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as InvoiceType;
    let page;

    try {
        const ReactDOMServer = (await import("react-dom/server")).default;
        const templateId = body.details.pdfTemplate;
        const InvoiceTemplate = await getInvoiceTemplate(templateId);

        if (!InvoiceTemplate) {
            return NextResponse.json(
                { error: "Unknown invoice template" },
                { status: 400 }
            );
        }

        /*
         * The template was invoked as a plain function — `InvoiceTemplate(body)`
         * — which runs its body outside React's render cycle, so it could not
         * use hooks. Rendering it as a real element inside NextIntlClientProvider
         * lets the templates call useTranslations, which is what makes the PDF
         * follow the user's locale instead of always emitting English.
         */
        const locale = resolveLocale(req.nextUrl.searchParams.get("locale"));
        const messages = await getMessages(locale);

        const htmlTemplate = ReactDOMServer.renderToStaticMarkup(
            React.createElement(InvoiceTemplate, {
                ...body,
                labels: buildInvoiceLabels(messages),
            })
        );

        // Shared instance — see services/invoice/server/browser.ts
        const browser = await getBrowser();
        page = await browser.newPage();

        /*
         * `networkidle0` waits for 500ms of complete network silence. With the
         * stylesheet now inlined below, the only remaining requests are the
         * template's own font links, so waiting for the DOM and then
         * specifically for fonts is both correct and much faster.
         */
        await page.setContent(htmlTemplate, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        // Inlined rather than fetched from a CDN on every request.
        await page.addStyleTag({ content: PDF_TAILWIND_CSS });

        // Fonts are decorative; don't fail a PDF over a slow font host.
        await page
            .evaluate(() => document.fonts.ready.then(() => undefined))
            .catch(() => undefined);

        const pdf = await page.pdf({
            format: "a4",
            printBackground: true,
            margin: {
                top: "0.4in",
                right: "0.4in",
                bottom: "0.4in",
                left: "0.4in",
            },
        });

        /*
         * Returned directly — the previous `new Blob([pdf])` copied the whole
         * buffer again for no reason. `inline` lets the browser preview it
         * instead of forcing a download.
         */
        return new NextResponse(pdf, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "inline; filename=invoice.pdf",
                "Content-Length": String(pdf.length),
                "Cache-Control": "no-store",
            },
            status: 200,
        });
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    } finally {
        // Only the page is closed; the browser is reused across requests.
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error("Error closing page:", e);
            }
        }
    }
}
