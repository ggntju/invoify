import { ReactNode } from "react";

// Types
import { InvoiceType } from "@/types";

type InvoiceLayoutProps = {
    data: InvoiceType;
    children: ReactNode;
};

// `data` stays in the props type (callers pass it) but is no longer read
// here now that the font links are gone.
export default function InvoiceLayout({ children }: InvoiceLayoutProps) {
    /*
     * The Google Fonts <link> tags that used to live here are gone.
     *
     * They made every PDF depend on a third party at request time, and the
     * wait for them was unreliable: page.setContent resolves on
     * domcontentloaded and document.fonts.ready resolves immediately when the
     * stylesheet has not been fetched yet, so Chromium printed with a fallback
     * (Arial) instead of Outfit. Both Outfit and the signature faces are now
     * embedded as base64 @font-face rules in the stylesheet injected by
     * generatePdfService — see scripts/build-pdf-css.mjs.
     *
     * The signature font name is still validated against SIGNATURE_FONTS in
     * lib/schemas.ts, so only known families can be requested.
     */
    return (
        <section style={{ fontFamily: "Outfit, sans-serif" }}>
            {/*
             * The tall min-height exists so the invoice card fills an A4 page.
             * It is scoped to print (page.pdf() emulates print media) and to lg
             * screens, so a phone preview isn't padded out with 960px of empty
             * white.
             */}
            <div className="flex min-h-[30rem] flex-col rounded-xl bg-white p-4 sm:p-10 lg:min-h-[60rem] print:min-h-[60rem]">
                {children}
            </div>
        </section>
    );
}
