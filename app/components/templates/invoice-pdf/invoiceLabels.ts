import enMessages from "@/i18n/locales/en.json";

/**
 * The set of strings the invoice document itself renders.
 *
 * These are passed to the templates as a plain prop rather than read from
 * next-intl's hooks, because the same components are rendered two different
 * ways: inside the client tree for the live preview, and through
 * `renderToStaticMarkup` in a route handler for the PDF.
 *
 * A React context was tried first and does not work here — anything exported
 * from a "use client" module becomes a client-reference proxy when imported by
 * a route handler, so neither the provider nor a helper could be used
 * server-side. A prop crosses both boundaries cleanly, and this module stays
 * free of React so it is safe to import from anywhere.
 */
export type InvoiceLabelKey = keyof typeof enMessages.invoiceDocument;

export type InvoiceLabels = Record<InvoiceLabelKey, string>;

export const DEFAULT_INVOICE_LABELS =
    enMessages.invoiceDocument as InvoiceLabels;

/** Props shared by every invoice template, beyond the invoice data itself. */
export type InvoiceTemplateExtras = {
    labels?: InvoiceLabels;
    /**
     * Presentation options. Optional and individually defaulted, so invoices
     * saved before theming existed still render.
     */
    theme?: Partial<import("./invoiceTheme").InvoiceTheme>;
};

/**
 * Builds a label set from a locale's raw messages, falling back per key to
 * English so an untranslated string never renders blank.
 */
export function buildInvoiceLabels(
    messages: Record<string, unknown> | undefined
): InvoiceLabels {
    const section = (messages?.invoiceDocument ?? {}) as Partial<InvoiceLabels>;

    const labels = { ...DEFAULT_INVOICE_LABELS };
    for (const key of Object.keys(labels) as InvoiceLabelKey[]) {
        const value = section[key];
        if (typeof value === "string" && value.length > 0) {
            labels[key] = value;
        }
    }
    return labels;
}
