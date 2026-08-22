"use client";

// ShadCn
import { Skeleton } from "@/components/ui/skeleton";
// Types
import { InvoiceType } from "@/types";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const DynamicInvoiceTemplateSkeleton = () => {
    // 60rem of forced height pushed the whole page down on mobile before the
    // template had even loaded.
    return <Skeleton className="min-h-[30rem] w-full lg:min-h-[60rem]" />;
};

const DynamicInvoiceTemplate = (props: InvoiceType) => {
    // Dynamic template component name
    const templateName = `InvoiceTemplate${props.details.pdfTemplate}`;

    const DynamicInvoice = useMemo(
        () =>
            dynamic<InvoiceType>(
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
