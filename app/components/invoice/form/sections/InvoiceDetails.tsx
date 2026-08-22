"use client";

// Components
import {
    CurrencySelector,
    DatePickerFormField,
    FormInput,
    FormFile,
    Subheading,
    TemplateGallery,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

const InvoiceDetails = () => {
    const { _t } = useTranslationContext();

    return (
        <section className="flex flex-col flex-wrap gap-5">
            <Subheading>{_t("form.steps.invoiceDetails.heading")}:</Subheading>

            <div className="grid grid-cols-1 gap-8">
                <div className="flex min-w-0 flex-col gap-3">
                    <FormFile
                        name="details.invoiceLogo"
                        label={_t(
                            "form.steps.invoiceDetails.invoiceLogo.label"
                        )}
                        placeholder={_t(
                            "form.steps.invoiceDetails.invoiceLogo.placeholder"
                        )}
                    />

                    <FormInput
                        name="details.invoiceNumber"
                        label={_t("form.steps.invoiceDetails.invoiceNumber")}
                        placeholder="Invoice number"
                    />

                    <DatePickerFormField
                        name="details.invoiceDate"
                        label={_t("form.steps.invoiceDetails.issuedDate")}
                    />

                    <DatePickerFormField
                        name="details.dueDate"
                        label={_t("form.steps.invoiceDetails.dueDate")}
                    />

                    <CurrencySelector
                        name="details.currency"
                        label={_t("form.steps.invoiceDetails.currency")}
                        placeholder="Select Currency"
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <TemplateGallery />
                </div>
            </div>
        </section>
    );
};

export default InvoiceDetails;
