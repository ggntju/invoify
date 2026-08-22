import React, { ReactNode } from "react";

// Labels & theme
import { DEFAULT_INVOICE_LABELS, type InvoiceTemplateExtras } from "./invoiceLabels";
import {
    densityScale,
    fontStack,
    resolveTheme,
    type InvoiceTheme,
} from "./invoiceTheme";

// Parts
import type { PartCtx } from "./parts";

// Types
import type { InvoiceType } from "@/types";

export type TemplateProps = InvoiceType & InvoiceTemplateExtras;

/**
 * Builds the context every layout part needs, from whatever props the template
 * was given. Missing labels fall back to English and a missing theme to the
 * default, so an invoice saved before theming existed still renders.
 */
export function templateCtx(data: TemplateProps): PartCtx {
    /*
     * The theme normally travels with the invoice (details.theme). The explicit
     * `theme` prop is an override, used by the gallery to preview a change
     * before it is committed to the form.
     */
    const theme: InvoiceTheme = resolveTheme(data.theme ?? data.details?.theme);
    return {
        data,
        labels: data.labels ?? DEFAULT_INVOICE_LABELS,
        theme,
        scale: densityScale(theme.density),
    };
}

/**
 * The sheet every layout sits on.
 *
 * Owns the things that must be identical across templates — the A4-ish page,
 * the chosen typeface, and the density padding — so a layout only concerns
 * itself with arrangement.
 *
 * The tall min-height is scoped to print (page.pdf() emulates print media) and
 * to lg screens, so it fills an A4 page without padding out a phone preview
 * with 960px of empty white.
 */
export default function TemplateFrame({
    ctx,
    children,
    bare = false,
}: {
    ctx: PartCtx;
    children: ReactNode;
    /** Skips the page padding, for layouts that paint edge-to-edge. */
    bare?: boolean;
}) {
    const { theme, scale } = ctx;

    return (
        <section
            style={{ fontFamily: fontStack(theme.fontId), color: "#111827" }}
        >
            <div
                className={`flex min-h-[30rem] flex-col overflow-hidden rounded-xl bg-white lg:min-h-[60rem] print:min-h-[60rem] ${
                    bare ? "" : scale.page
                }`}
            >
                {children}
            </div>
        </section>
    );
}
