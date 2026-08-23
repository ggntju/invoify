"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import {
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
        <div className="min-w-0">
            <div className="mx-auto max-w-2xl xl:mx-0">
                <header className="mb-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                            {_t("form.title")}
                        </h1>
                        <span className="text-sm text-muted-foreground">
                            {invoiceNumberLabel}
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
                     * Two columns on tablet, but back to one at xl: the form
                     * column is the narrower half of the page there, so
                     * splitting it again would crush both sub-forms. The
                     * divider carries the separation instead of a border box
                     * around each.
                     */}
                    <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:gap-8 md:divide-y-0 xl:grid-cols-1 xl:gap-0 xl:divide-y">
                        <div className="pb-8 md:pb-0 xl:pb-8">
                            <BillFromSection />
                        </div>

                        <div className="pt-8 md:pt-0 xl:pt-8">
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
