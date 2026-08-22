"use client";

import { memo, useMemo } from "react";

// Next Intl
import { useMessages } from "next-intl";

// Components
import { DynamicInvoiceTemplate, Subheading } from "@/app/components";

// Labels
import { buildInvoiceLabels } from "@/app/components/templates/invoice-pdf/invoiceLabels";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Types
import { InvoiceType } from "@/types";

type LivePreviewProps = {
    data: InvoiceType;
};

function LivePreview({ data }: LivePreviewProps) {
    const { _t } = useTranslationContext();

    /*
     * Labels are passed down as a prop rather than read from next-intl inside
     * the template, because the same component is rendered server-side through
     * renderToStaticMarkup for the PDF, where next-intl's hooks are not
     * available. See invoiceLabels.ts
     */
    const messages = useMessages();
    const labels = useMemo(
        () => buildInvoiceLabels(messages as Record<string, unknown>),
        [messages]
    );

    return (
        <>
            <Subheading>{_t("actions.livePreview")}:</Subheading>
            <div className="my-1 overflow-hidden rounded-xl border border-border">
                <DynamicInvoiceTemplate {...data} labels={labels} />
            </div>
        </>
    );
}

/*
 * Memoised on `data` identity. PdfViewer re-renders on every keystroke because
 * it subscribes to the form, but the debounced value it passes down only gets
 * a new identity every 400ms — so the invoice template re-renders then, rather
 * than on each character typed.
 */
export default memo(LivePreview);
