"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import {
    AutosaveIndicator,
    WizardStep,
    BillFromSection,
    BillToSection,
    InvoiceDetails,
    Items,
    PaymentInformation,
    InvoiceSummary,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

const InvoiceForm = () => {
    const { _t } = useTranslationContext();

    const { control } = useFormContext();

    // Get invoice number variable
    const invoiceNumber = useWatch({
        name: "details.invoiceNumber",
        control,
    });

    const invoiceNumberLabel = useMemo(() => {
        if (invoiceNumber) {
            return `#${invoiceNumber}`;
        } else {
            return _t("form.newInvBadge");
        }
    }, [invoiceNumber]);

    /*
     * No Card here any more.
     *
     * Every field used to sit inside a card, inside a card, inside a bordered
     * step — three nested borders before you reached an input, which is most of
     * why the form read as busy. The form is now a plain column separated by
     * hairlines, and the only boxed surface left on the page is the invoice
     * preview itself.
     */
    return (
        // `min-h-0` is what actually lets a grid child shrink and scroll; without
        // it the pane grows to its content and the page scrolls instead.
        // `@container` scopes every responsive rule inside the form to the width
        // of this column rather than the viewport. Without it, a `sm:` class
        // fires on a 1440px desktop even though the form itself is a ~420px
        // rail, which is how a 12-column line-item grid ends up in 420px.
        <div className="@container min-w-0 shell:flex shell:min-h-0 shell:flex-col shell:border-r shell:border-border shell:bg-card">
            <div className="mx-auto max-w-2xl shell:min-h-0 shell:overflow-y-auto shell:p-5 xl:mx-0">
                <header className="mb-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        {/*
                          * A <p>, not an <h1>. This said "Invoice" — a form
                          * label, not the page's subject — while every invoice
                          * template also renders headings inside the live
                          * preview, so the document carried several competing
                          * h1s made of the user's own data. The real h1 is in
                          * LandingContent.
                          */}
                        <p className="text-xl font-semibold tracking-tight @2xl:text-2xl">
                            {_t("form.title")}
                        </p>
                        <span className="flex items-center gap-3">
                            <AutosaveIndicator />
                            <span className="text-sm text-muted-foreground">
                                {invoiceNumberLabel}
                            </span>
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {_t("form.description")}
                    </p>
                </header>

                {/*
                 * react-use-wizard is gone; the active step lives in
                 * WizardContext. `step` indexes into WIZARD_STEPS, which is
                 * now the single source of order and labels.
                 */}
                <WizardStep step={0}>
                    {/*
                     * Two columns when the form column is wide enough to hold
                     * them, one when it is not. This used to be `md:` plus an
                     * `xl:` override undoing it, because the viewport said
                     * "wide" while the form column was actually the narrow half
                     * of a split layout. A container query states the real rule
                     * once: split at 672px of column, stack below.
                     */}
                    <div className="grid grid-cols-1 divide-y divide-border @2xl:grid-cols-2 @2xl:gap-8 @2xl:divide-y-0">
                        <div className="pb-8 @2xl:pb-0">
                            <BillFromSection />
                        </div>

                        <div className="pt-8 @2xl:pt-0">
                            <BillToSection />
                        </div>
                    </div>
                </WizardStep>

                <WizardStep step={1}>
                    <InvoiceDetails />
                </WizardStep>

                <WizardStep step={2}>
                    <Items />
                </WizardStep>

                <WizardStep step={3}>
                    <PaymentInformation />
                </WizardStep>

                <WizardStep step={4}>
                    <InvoiceSummary />
                </WizardStep>
            </div>
        </div>
    );
};

export default InvoiceForm;
