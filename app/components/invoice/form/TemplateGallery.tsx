"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type TemplateGalleryProps = {
    /**
     * `field` is the labelled thumbnail inside the Details step, used below xl.
     * `chips` is the three-pill row above the invoice in the desktop preview
     * toolbar, where option B puts template, accent and density.
     *
     * One component either way, so both entry points share a single dialog
     * instance rather than mounting two.
     */
    variant?: "field" | "chips";
};

/**
 * Trailing debounce for the custom colour picker. Long enough that a drag
 * produces a handful of commits rather than dozens, short enough that letting
 * go feels immediate.
 */
const ACCENT_COMMIT_DELAY_MS = 140;

const TemplateGallery = ({ variant = "field" }: TemplateGalleryProps) => {
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

    /*
     * Memoised on the three primitives, not on `themeRaw`.
     *
     * resolveTheme returns a fresh object literal every call, so an unmemoised
     * `theme` gave `previewBase` a new identity on every render — which meant
     * the `memo` on TemplatePreview never hit and all thirteen miniatures
     * re-rendered for reasons entirely unrelated to the theme.
     */
    const theme = useMemo(
        () => resolveTheme(themeRaw),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [themeRaw?.accentColor, themeRaw?.fontId, themeRaw?.density]
    );

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

    const setTheme = useCallback(
        (patch: Partial<typeof theme>) => {
            setValue(
                "details.theme",
                { ...theme, ...patch },
                { shouldDirty: true }
            );
        },
        [setValue, theme]
    );

    /*
     * The custom colour input, debounced.
     *
     * A native `<input type="color">` streams `change` events continuously
     * while the user drags around the picker — dozens per second. Each one was
     * committing to form state, which re-rendered all thirteen gallery
     * miniatures, each a complete invoice template. That is what made dragging
     * the colour feel stuck to treacle.
     *
     * The swatch itself is driven by local state so it tracks the pointer with
     * no lag, and the form is written on a trailing timer. Presets commit
     * immediately — they are a single discrete click, not a drag.
     */
    const [draftAccent, setDraftAccent] = useState<string | null>(null);
    const accentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const commitAccent = useCallback(
        (value: string) => {
            setDraftAccent(value);
            if (accentTimer.current) clearTimeout(accentTimer.current);
            accentTimer.current = setTimeout(() => {
                setTheme({ accentColor: value });
                setDraftAccent(null);
            }, ACCENT_COMMIT_DELAY_MS);
        },
        [setTheme]
    );

    // Flush a pending colour rather than dropping it if the dialog closes mid-drag.
    useEffect(
        () => () => {
            if (accentTimer.current) clearTimeout(accentTimer.current);
        },
        []
    );

    const shownAccent = draftAccent ?? theme.accentColor;

    // Ordered smallest to largest, so the row reads as a scale.
    const densities: { id: InvoiceDensity; label: string }[] = [
        { id: "compact", label: _t("gallery.compact") },
        { id: "comfortable", label: _t("gallery.comfortable") },
        { id: "spacious", label: _t("gallery.spacious") },
    ];

    const densityLabel =
        densities.find((d) => d.id === theme.density)?.label ??
        _t("gallery.comfortable");

    const fontLabel =
        INVOICE_FONTS.find((f) => f.id === theme.fontId)?.name ??
        INVOICE_FONTS[0].name;

    /*
     * The chip row that sits above the invoice in the desktop toolbar, as in
     * option B. Three separate buttons all opening the same dialog, so the
     * dialog is controlled rather than wrapped in a single DialogTrigger.
     */
    const chip =
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground";

    const trigger =
        variant === "chips" ? (
            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    className={chip}
                    onClick={() => handleOpenChange(true)}
                >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    {activeName}
                </button>

                <button
                    type="button"
                    className={chip}
                    onClick={() => handleOpenChange(true)}
                    aria-label={_t("gallery.accent")}
                >
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: theme.accentColor }}
                    />
                    {fontLabel}
                </button>

                <button
                    type="button"
                    className={chip}
                    onClick={() => handleOpenChange(true)}
                >
                    {densityLabel}
                </button>
            </div>
        ) : (
            <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("gallery.templateLabel")}
                </p>
                <button
                    type="button"
                    onClick={() => handleOpenChange(true)}
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
            </>
        );

    return (
        <div className={variant === "chips" ? "min-w-0" : undefined}>
            {trigger}

            <Dialog open={open} onOpenChange={handleOpenChange}>
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
                                        style={
                                            draftAccent
                                                ? {
                                                      backgroundColor:
                                                          draftAccent,
                                                      borderStyle: "solid",
                                                  }
                                                : undefined
                                        }
                                    >
                                        {draftAccent ? "" : "+"}
                                        <input
                                            type="color"
                                            className="sr-only"
                                            value={shownAccent}
                                            onChange={(e) =>
                                                commitAccent(e.target.value)
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
