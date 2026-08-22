"use client";

// Debounce
import { useDebounce } from "use-debounce";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import { FinalPdf, LivePreview } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Types
import { InvoiceType } from "@/types";

const PdfViewer = () => {
    const { invoicePdf } = useInvoiceContext();

    const { control } = useFormContext<InvoiceType>();

    /*
     * `useDebounce` debounces a value, but `watch` is a stable function
     * reference that never changes — so the previous
     * `useDebounce(watch, 1000)` was inert, and calling `watch()` bare during
     * render subscribed to every field. The result was a full re-render of the
     * invoice template on every keystroke.
     *
     * Debouncing the values instead means `debouncedValues` keeps a stable
     * identity between ticks, so the memoised LivePreview below can bail out.
     */
    const formValues = useWatch({ control }) as InvoiceType;
    const [debouncedValues] = useDebounce(formValues, 400);

    return (
        <div className="my-3">
            {invoicePdf.size == 0 ? (
                <LivePreview data={debouncedValues} />
            ) : (
                <FinalPdf />
            )}
        </div>
    );
};

export default PdfViewer;
