"use client";

// ShadCn
import { Skeleton } from "@/components/ui/skeleton";
// Types
import { InvoiceType } from "@/types";
import dynamic from "next/dynamic";

// Labels
import { InvoiceTemplateExtras } from "./invoiceLabels";
import React, { useMemo } from "react";

const DynamicInvoiceTemplateSkeleton = () => {
    // 60rem of forced height pushed the whole page down on mobile before the
    // template had even loaded.
    return <Skeleton className="min-h-[30rem] w-full lg:min-h-[60rem]" />;
};

type DynamicInvoiceTemplateProps = InvoiceType & InvoiceTemplateExtras;

const DynamicInvoiceTemplate = (props: DynamicInvoiceTemplateProps) => {
    // Dynamic template component name
    const templateName = `InvoiceTemplate${props.details.pdfTemplate}`;

    const DynamicInvoice = useMemo(
        () =>
            dynamic<DynamicInvoiceTemplateProps>(
                () =>
                    import(
                        `@/app/components/templates/invoice-pdf/${templateName}`
                    ),
                {
                    loading: () => <DynamicInvoiceTemplateSkeleton />,
                    ssr: false,
                }
            ),
        [templateName]
    );

    return <DynamicInvoice {...props} />;
};

export default React.memo(DynamicInvoiceTemplate);
