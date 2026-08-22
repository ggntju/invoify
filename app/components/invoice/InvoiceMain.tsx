"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Form } from "@/components/ui/form";

// Components
import {
    InvoiceActions,
    InvoiceForm,
    MobileActionBar,
} from "@/app/components";

// Context
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Hooks
import useToasts from "@/hooks/useToasts";

// Types
import { InvoiceType } from "@/types";

const InvoiceMain = () => {
    const formContext = useFormContext<InvoiceType>();
    const { handleSubmit } = formContext;

    // Get the needed values from invoice context
    const { onFormSubmit } = useInvoiceContext();

    const { formValidationError } = useToasts();

    return (
        <Form {...formContext}>
            <form onSubmit={handleSubmit(onFormSubmit, formValidationError)}>
                {/*
                 * Mobile-first single column; two columns only at xl, where
                 * there is room for the form and the live preview side by side.
                 * `minmax(0, …)` lets the columns shrink below their content
                 * width instead of forcing the page to scroll horizontally.
                 */}
                {/*
                 * The preview column is deliberately the wider of the two: the
                 * invoice is what the user actually cares about, so it reads as
                 * the hero and the form beside it stays quiet.
                 */}
                <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] xl:gap-12">
                    <InvoiceForm />
                    <InvoiceActions />
                </div>

                {/* Sticky Preview / Generate bar, below xl only */}
                <MobileActionBar />
            </form>
        </Form>
    );
};

export default InvoiceMain;
