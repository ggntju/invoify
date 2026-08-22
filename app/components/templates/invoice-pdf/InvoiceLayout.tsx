import { ReactNode } from "react";

// Variables
import { SIGNATURE_FONTS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

type InvoiceLayoutProps = {
    data: InvoiceType;
    children: ReactNode;
};

export default function InvoiceLayout({ data, children }: InvoiceLayoutProps) {
    const { details } = data;

    /*
     * The selected font name is user-controlled and was interpolated straight
     * into a third-party URL. Only names on the known list are allowed through,
     * so arbitrary attacker-supplied content can't reach fonts.googleapis.com
     * from the server during PDF generation.
     */
    const requestedFont = details.signature?.fontFamily;
    const allowedFont = SIGNATURE_FONTS.find(
        (font) => font.name === requestedFont
    );

    // Instead of fetching all signature fonts, get the specific one user selected.
    const fontHref = allowedFont
        ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
              allowedFont.name
          )}&display=swap`
        : "";

    const head = (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            ></link>
            {fontHref && <link href={fontHref} rel="stylesheet" />}
        </>
    );

    return (
        <>
            {head}
            <section style={{ fontFamily: "Outfit, sans-serif" }}>
                {/*
                 * The tall min-height exists so the invoice card fills an A4
                 * page. It is scoped to print (page.pdf() emulates print media)
                 * and to lg screens, so a phone preview isn't padded out with
                 * 960px of empty white.
                 */}
                <div className="flex min-h-[30rem] flex-col rounded-xl bg-white p-4 sm:p-10 lg:min-h-[60rem] print:min-h-[60rem]">
                    {children}
                </div>
            </section>
        </>
    );
}
