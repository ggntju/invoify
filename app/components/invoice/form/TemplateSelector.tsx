"use client";

import Image from "next/image";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Utils
import { cn } from "@/lib/utils";

// Components
import {
    BaseButton,
    InvoiceTemplate1,
    InvoiceTemplate2,
} from "@/app/components";

// Template images
import template1 from "@/public/assets/img/invoice-1-example.png";
import template2 from "@/public/assets/img/invoice-2-example.png";

// Icons
import { Check } from "lucide-react";

// Types
import { InvoiceType } from "@/types";

const TemplateSelector = () => {
    const { watch, setValue } = useFormContext<InvoiceType>();
    const formValues = watch();
    const templates = [
        {
            id: 1,
            name: "Template 1",
            description: "Template 1 description",
            img: template1,
            component: <InvoiceTemplate1 {...formValues} />,
        },
        {
            id: 2,
            name: "Template 2",
            description: "Second template",
            img: template2,
            component: <InvoiceTemplate2 {...formValues} />,
        },
    ];
    return (
        <>
            <Card className="w-full min-w-0">
                <CardHeader className="pb-3">
                    <Label className="text-base font-semibold">
                        Choose Invoice Template
                    </Label>
                    <CardDescription>
                        Select one of the predefined templates
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {/*
                     * Snap scrolling with narrower thumbnails on mobile — at
                     * a fixed 300px barely one template fit on a phone screen.
                     */}
                    <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
                        {templates.map((template) => {
                            const isSelected =
                                formValues.details.pdfTemplate === template.id;

                            return (
                                <div
                                    key={template.id}
                                    className="flex w-[9rem] shrink-0 snap-start flex-col gap-y-3 sm:w-[12rem]"
                                >
                                    <p className="text-sm font-medium">
                                        {template.name}
                                    </p>

                                    <button
                                        type="button"
                                        aria-pressed={isSelected}
                                        aria-label={`Select ${template.name}`}
                                        onClick={() =>
                                            setValue(
                                                "details.pdfTemplate",
                                                template.id
                                            )
                                        }
                                        className={cn(
                                            "relative overflow-hidden rounded-lg border-2 transition-colors",
                                            isSelected
                                                ? "border-primary"
                                                : "border-border hover:border-primary/60"
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="absolute right-2 top-2 z-10 rounded-full bg-primary p-1 text-primary-foreground shadow-card">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                        <Image
                                            src={template.img}
                                            alt={template.name}
                                            width={300}
                                            height={700}
                                            placeholder="blur"
                                            className="h-auto w-full"
                                        />
                                    </button>

                                    <BaseButton
                                        variant={
                                            isSelected ? "default" : "outline"
                                        }
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                            setValue(
                                                "details.pdfTemplate",
                                                template.id
                                            )
                                        }
                                    >
                                        {isSelected ? "Selected" : "Select"}
                                    </BaseButton>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default TemplateSelector;
