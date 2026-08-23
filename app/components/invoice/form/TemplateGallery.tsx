"use client";

import { memo, useEffect, useMemo, useState } from "react";

// Next Intl
import { useLocale } from "next-intl";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Components
import { BaseButton, DynamicInvoiceTemplate } from "@/app/components";

// Template system
import {
    TEMPLATES,
    DEFAULT_TEMPLATE_ID,
    getTemplateEntry,
} from "@/app/components/templates/invoice-pdf/registry";
import {
    ACCENT_PRESETS,
    DEFAULT_INVOICE_THEME,
    INVOICE_FONTS,
    resolveTheme,
    type InvoiceDensity,
    type InvoiceFontId,
} from "@/app/components/templates/invoice-pdf/invoiceTheme";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, LayoutTemplate } from "lucide-react";

// Types
import type { InvoiceType } from "@/types";

/**
 * Miniature of a template, rendered from the real component.
 *
 * Deliberately a live render rather than a pre-generated PNG. The plan called
 * for screenshotting each template through Puppeteer at build time, but that
 * needs a running server to render against and produces thirteen binaries that
 * go stale the moment a layout changes. Scaling the actual component down is
 * always accurate, needs no build step, and costs one static render each.
 */
const TemplatePreview = memo(function TemplatePreview({
    values,
    templateId,
    locale,
    scale = 0.34,
    height = 250,
}: {
    values: InvoiceType;
    templateId: number;
    locale: string;
    scale?: number;
    height?: number;
}) {
    const previewValues = useMemo(
        () => ({
            ...values,
            details: { ...values.details, pdfTemplate: templateId },
        }),
        [values, templateId]
    );

    return (
        <div
            className="pointer-events-none overflow-hidden bg-white"
            style={{ height }}
            aria-hidden="true"
        >
            <div
                style={{
                    width: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
            >
                <DynamicInvoiceTemplate {...previewValues} locale={locale} />
            </div>
        </div>
    );
});

const TemplateGallery = () => {
    const { control, setValue, getValues } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const locale = useLocale();

    const [open, setOpen] = useState(false);

    /*
     * The gallery renders thirteen full invoice templates at once. Feeding them
     * live form values meant every keystroke re-rendered all thirteen, and the
     * re-render triggered by picking a template interrupted the dialog's exit
     * animation — leaving a phantom overlay with `pointer-events: none` on the
     * body, i.e. a frozen page.
     *
     * The miniatures are illustrative, so they run off a snapshot taken when
     * the dialog opens. Only the theme is live, because changing it is the one
     * thing the previews exist to show.
     */
    const [snapshot, setSnapshot] = useState<InvoiceType | null>(null);

    /*
     * Narrow subscription. This was `useWatch({ control })` with no name — a
     * full-form watch that re-rendered the gallery on every keystroke anywhere
     * in the invoice, to read two fields. The component is permanently mounted
     * in the details step, so that cost was paid constantly.
     */
    const [activeIdRaw, themeRaw] = useWatch({
        control,
        name: ["details.pdfTemplate", "details.theme"],
    });

    const activeId = activeIdRaw ?? DEFAULT_TEMPLATE_ID;
    const theme = resolveTheme(themeRaw);

    /*
     * The trigger thumbnail is 64px tall at 0.12 scale — nothing typed into the
     * form is legible in it. It refreshes when the template or theme changes,
     * which is all it exists to show, rather than re-rendering a whole invoice
     * template per character.
     */
    const [triggerValues, setTriggerValues] = useState<InvoiceType | null>(null);

    useEffect(() => {
        setTriggerValues(getValues());
    }, [activeId, theme.accentColor, theme.fontId, theme.density, getValues]);

    const activeName =
        getTemplateEntry(activeId)?.name ??
        getTemplateEntry(DEFAULT_TEMPLATE_ID)!.name;

    const previewBase = useMemo<InvoiceType | null>(() => {
        if (!snapshot) return null;
        return {
            ...snapshot,
            details: { ...snapshot.details, theme },
        };
    }, [snapshot, theme]);

    const handleOpenChange = (next: boolean) => {
        if (next) setSnapshot(getValues());
        setOpen(next);
    };

    const setTheme = (patch: Partial<typeof theme>) => {
        setValue(
            "details.theme",
            { ...theme, ...patch },
            { shouldDirty: true }
        );
    };

    const densities: { id: InvoiceDensity; label: string }[] = [
        { id: "comfortable", label: _t("gallery.comfortable") },
        { id: "compact", label: _t("gallery.compact") },
    ];

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {_t("gallery.templateLabel")}
            </p>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:border-primary/60"
                    >
                        <div className="w-24 shrink-0 overflow-hidden rounded border border-border">
                            {triggerValues && (
                                <TemplatePreview
                                    values={triggerValues}
                                    templateId={activeId}
                                    locale={locale}
                                    scale={0.12}
                                    height={64}
                                />
                            )}
                        </div>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                                {activeName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {_t("gallery.changeTemplate")}
                            </span>
                        </span>
                        <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                </DialogTrigger>

                <DialogContent className="flex h-[92dvh] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl">
                    <DialogHeader className="shrink-0 border-b px-5 py-4 text-left">
                        <DialogTitle>{_t("gallery.title")}</DialogTitle>
                        <DialogDescription>
                            {_t("gallery.description")}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Theme controls */}
                    <div className="shrink-0 border-b px-5 py-3">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.accent")}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {ACCENT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            title={preset.name}
                                            aria-label={preset.name}
                                            aria-pressed={
                                                theme.accentColor ===
                                                preset.value
                                            }
                                            onClick={() =>
                                                setTheme({
                                                    accentColor: preset.value,
                                                })
                                            }
                                            className={cn(
                                                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                                                theme.accentColor ===
                                                    preset.value
                                                    ? "border-foreground"
                                                    : "border-transparent"
                                            )}
                                            style={{
                                                backgroundColor: preset.value,
                                            }}
                                        />
                                    ))}
                                    <label
                                        className="ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground"
                                        title={_t("gallery.customColor")}
                                    >
                                        +
                                        <input
                                            type="color"
                                            className="sr-only"
                                            value={theme.accentColor}
                                            onChange={(e) =>
                                                setTheme({
                                                    accentColor:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            <Separator
                                orientation="vertical"
                                className="hidden h-6 sm:block"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.font")}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {INVOICE_FONTS.map((font) => (
                                        <button
                                            key={font.id}
                                            type="button"
                                            onClick={() =>
                                                setTheme({
                                                    fontId:
                                                        font.id as InvoiceFontId,
                                                })
                                            }
                                            aria-pressed={
                                                theme.fontId === font.id
                                            }
                                            className={cn(
                                                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                                                theme.fontId === font.id
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            style={{ fontFamily: font.stack }}
                                        >
                                            {font.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator
                                orientation="vertical"
                                className="hidden h-6 sm:block"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.density")}
                                </span>
                                <div className="flex gap-1">
                                    {densities.map((d) => (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() =>
                                                setTheme({ density: d.id })
                                            }
                                            aria-pressed={
                                                theme.density === d.id
                                            }
                                            className={cn(
                                                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                                                theme.density === d.id
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <BaseButton
                                variant="ghost"
                                size="sm"
                                className="ml-auto text-muted-foreground"
                                onClick={() =>
                                    setTheme(DEFAULT_INVOICE_THEME)
                                }
                            >
                                {_t("gallery.reset")}
                            </BaseButton>
                        </div>
                    </div>

                    {/* Gallery grid */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {TEMPLATES.map((template) => {
                                const isSelected = template.id === activeId;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => {
                                            setOpen(false);
                                            setValue(
                                                "details.pdfTemplate",
                                                template.id,
                                                { shouldDirty: true }
                                            );
                                        }}
                                        className={cn(
                                            "group relative overflow-hidden rounded-xl border-2 text-left transition-colors",
                                            isSelected
                                                ? "border-primary"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="absolute right-2 top-2 z-10 rounded-full bg-primary p-1 text-primary-foreground shadow-card">
                                                <Check className="h-3.5 w-3.5" />
                                            </span>
                                        )}

                                        {previewBase && (
                                            <TemplatePreview
                                                values={previewBase}
                                                templateId={template.id}
                                                locale={locale}
                                            />
                                        )}

                                        <div className="border-t border-border bg-card px-3 py-2">
                                            <p className="text-sm font-medium">
                                                {template.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TemplateGallery;
