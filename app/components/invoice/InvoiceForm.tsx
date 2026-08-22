"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// React Wizard
import { Wizard } from "react-use-wizard";

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

    return (
        <div className="min-w-0">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-xl uppercase md:text-2xl">
                            {_t("form.title")}
                        </CardTitle>
                        <Badge variant="secondary" className="w-fit text-sm">
                            {invoiceNumberLabel}
                        </Badge>
                    </div>
                    <CardDescription>{_t("form.description")}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div className="space-y-8">
                        <Wizard>
                            <WizardStep>
                                {/*
                                 * `flex` alone does not wrap, so these two
                                 * sections used to stay side by side and get
                                 * crushed on narrow screens.
                                 */}
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
                                    <BillFromSection />

                                    <BillToSection />
                                </div>
                            </WizardStep>
                            <WizardStep>
                                <div className="flex flex-wrap gap-y-10">
                                    <InvoiceDetails />
                                </div>
                            </WizardStep>

                            <WizardStep>
                                <Items />
                            </WizardStep>

                            <WizardStep>
                                <PaymentInformation />
                            </WizardStep>

                            <WizardStep>
                                <InvoiceSummary />
                            </WizardStep>
                        </Wizard>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoiceForm;
