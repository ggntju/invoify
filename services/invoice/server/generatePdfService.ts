import { NextRequest, NextResponse } from "next/server";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

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
    const body: InvoiceType = await req.json();
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

        const htmlTemplate = ReactDOMServer.renderToStaticMarkup(
            InvoiceTemplate(body)
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
