"use client";

import { memo } from "react";

// Components
import { DynamicInvoiceTemplate, Subheading } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Types
import { InvoiceType } from "@/types";

type LivePreviewProps = {
    data: InvoiceType;
};

function LivePreview({ data }: LivePreviewProps) {
    const { _t } = useTranslationContext();

    return (
        <>
            <Subheading>{_t("actions.livePreview")}:</Subheading>
            <div className="my-1 overflow-hidden rounded-xl border border-border">
                <DynamicInvoiceTemplate {...data} />
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
