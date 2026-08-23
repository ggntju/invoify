"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch, type FieldErrors } from "react-hook-form";

// ShadCn
import { Progress } from "@/components/ui/progress";

// Hooks
import { useIsShell } from "@/hooks/useMediaQuery";

// Contexts
import { useWizard } from "@/contexts/WizardContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Steps
import {
    WIZARD_STEPS,
    WIZARD_WATCHED_FIELDS,
    isItemsStep,
} from "@/lib/wizardSteps";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { AlertCircle, Check } from "lucide-react";

// Types
import { InvoiceType, ItemType } from "@/types";

/**
 * `partial` is the important one: a step the user has passed through but not
 * actually filled in. Previously any step behind the cursor rendered a green
 * check, because RHF validates on submit so `errors` is empty until then —
 * skipping ahead marked the whole form complete, which is a lie.
 */
type StepState = "invalid" | "active" | "complete" | "partial" | "upcoming";

const filled = (value: unknown) =>
    typeof value === "string"
        ? value.trim().length > 0
        : value !== undefined && value !== null && value !== "";

/** Walks a dotted path into the errors object. */
function hasError(errors: FieldErrors<InvoiceType>, path: string): boolean {
    let node: unknown = errors;
    for (const key of path.split(".")) {
        if (!node || typeof node !== "object") return false;
        node = (node as Record<string, unknown>)[key];
        if (node === undefined) return false;
    }
    return Boolean(node);
}

const WizardProgress = () => {
    const { activeStep, stepCount, goToStep } = useWizard();

    /*
     * Branch in JS, not with `hidden`/`shell:block`.
     *
     * Rendering both shapes and hiding one with CSS put two complete <ol>s of
     * step buttons in the DOM, so assistive technology announced ten steps for
     * a five-step form.
     */
    const isShell = useIsShell();

    const {
        control,
        formState: { errors },
    } = useFormContext<InvoiceType>();

    const { _t } = useTranslationContext();

    /*
     * Narrow subscription driven by the step definitions, so adding a field to
     * a step's completeness automatically widens the watch. This was a
     * full-form `useWatch({ control })`, which re-rendered on every keystroke
     * anywhere in the invoice — including the base64 logo.
     */
    const watched = useWatch({
        control,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: WIZARD_WATCHED_FIELDS as any,
    }) as unknown[];

    const values = useMemo(() => {
        const map: Record<string, unknown> = {};
        WIZARD_WATCHED_FIELDS.forEach((field, index) => {
            map[field] = watched[index];
        });
        return map;
    }, [watched]);

    const steps = useMemo(() => {
        const items = (values["details.items"] as ItemType[] | undefined) ?? [];

        return WIZARD_STEPS.map((step) => {
            const isValid = !step.errorPaths.some((path) =>
                hasError(errors, path)
            );
            const label = _t(`form.wizard.${step.labelKey}`);

            if (isItemsStep(step.id)) {
                return {
                    ...step,
                    label,
                    isValid,
                    isComplete:
                        items.length > 0 &&
                        items.every(
                            (item) =>
                                filled(item?.name) &&
                                Number(item?.quantity) > 0 &&
                                Number(item?.unitPrice) > 0
                        ),
                    isStarted: items.some((item) => filled(item?.name)),
                };
            }

            const fieldValues = step.requiredFields.map(
                (field) => values[field]
            );

            return {
                ...step,
                label,
                isValid,
                isComplete: fieldValues.every(filled),
                isStarted: fieldValues.some(filled),
            };
        });
    }, [values, errors, _t]);

    type Step = (typeof steps)[number];

    /**
     * Resolves the visual state of a step. Invalid always wins so a step with
     * errors stays flagged even while it is the active one.
     */
    const getStepState = (step: Step): StepState => {
        if (!step.isValid) return "invalid";
        if (step.isComplete) return "complete";
        if (step.id === activeStep) return "active";
        if (step.isStarted) return "partial";
        return "upcoming";
    };

    /** Colours for the numbered marker. */
    const markerStyles: Record<StepState, string> = {
        invalid: "border-destructive bg-destructive text-destructive-foreground",
        active: "border-primary bg-primary text-primary-foreground",
        complete: "border-success bg-success text-success-foreground",
        // Started but unfinished: clearly in progress, never mistakable for done
        partial: "border-primary bg-primary/15 text-primary",
        upcoming: "border-border bg-muted text-muted-foreground",
    };

    /** Colours for the label beside it, from sm up. */
    const labelStyles: Record<StepState, string> = {
        invalid: "text-destructive",
        active: "text-foreground",
        complete: "text-foreground",
        partial: "text-muted-foreground",
        upcoming: "text-muted-foreground",
    };

    const activeStepData = steps[activeStep];
    const activeStepState = activeStepData
        ? getStepState(activeStepData)
        : "upcoming";

    const renderMarker = (step: Step, state: StepState, isActive: boolean) => {
        if (isActive) return step.id + 1;
        if (state === "invalid") return <AlertCircle className="h-3.5 w-3.5" />;
        if (state === "complete") return <Check className="h-3.5 w-3.5" />;
        return step.id + 1;
    };

    const stepAriaLabel = (step: Step, state: StepState) =>
        `${_t("form.wizard.stepLabel")} ${step.id + 1}: ${step.label}${
            state === "invalid"
                ? ` — ${_t("form.wizard.hasErrors")}`
                : state === "complete"
                  ? ` — ${_t("form.wizard.stateComplete")}`
                  : state === "partial"
                    ? ` — ${_t("form.wizard.stateIncomplete")}`
                    : ""
        }`;

    /*
     * Two shapes, one component.
     *
     * On a phone the five steps are a compact row of dots with the active
     * step's name above — five labels do not fit in 375px. That row is signed
     * off and unchanged.
     *
     * At `shell`, where the form is a ~420px rail, the steps become a vertical
     * outline: a full-size marker and a full-length label per row, the way
     * option B's "SECTIONS" list works. This is also why the markers were too
     * small before — they had shrunk to 20px with 11px text purely to fit five
     * labels across a horizontal row, which a vertical list does not have to
     * do.
     */
    return (
        <nav aria-label={_t("form.wizard.progressLabel")} className="mb-6">
            {/* Compact header + progress rule. */}
            {!isShell && (
                <div>
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                        {activeStepData?.label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {_t("form.wizard.stepLabel")} {activeStep + 1} /{" "}
                        {stepCount}
                    </span>
                </div>

                <Progress
                    value={((activeStep + 1) / stepCount) * 100}
                    indicatorClassName={cn(
                        activeStepState === "invalid" && "bg-destructive"
                    )}
                />

                <ol className="mt-3 flex items-center gap-1.5 sm:gap-1">
                    {steps.map((step) => {
                        const state = getStepState(step);
                        const isActive = step.id === activeStep;

                        return (
                            <li key={step.id} className="min-w-0 sm:flex-1">
                                <button
                                    type="button"
                                    onClick={() => goToStep(step.id)}
                                    aria-label={stepAriaLabel(step, state)}
                                    aria-current={isActive ? "step" : undefined}
                                    title={step.label}
                                    className="flex w-full items-center gap-1.5 rounded-md transition-opacity hover:opacity-80 sm:gap-1"
                                >
                                    <span
                                        className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold sm:h-5 sm:w-5 sm:text-[10px]",
                                            markerStyles[state]
                                        )}
                                    >
                                        {renderMarker(step, state, isActive)}
                                    </span>

                                    <span
                                        className={cn(
                                            "hidden min-w-0 truncate text-left text-[11px] leading-tight sm:inline",
                                            isActive
                                                ? "font-semibold"
                                                : "font-medium",
                                            labelStyles[state]
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
                </div>
            )}

            {/* Vertical outline: the rail's table of contents. */}
            {isShell && (
                <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("form.wizard.sections")}
                </p>

                <ol className="-mx-2 space-y-0.5">
                    {steps.map((step) => {
                        const state = getStepState(step);
                        const isActive = step.id === activeStep;

                        return (
                            <li key={step.id}>
                                <button
                                    type="button"
                                    onClick={() => goToStep(step.id)}
                                    aria-label={stepAriaLabel(step, state)}
                                    aria-current={isActive ? "step" : undefined}
                                    className={cn(
                                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                                        isActive
                                            ? "bg-primary/10"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                                            markerStyles[state]
                                        )}
                                    >
                                        {renderMarker(step, state, isActive)}
                                    </span>

                                    <span
                                        className={cn(
                                            "min-w-0 flex-1 truncate text-[13px]",
                                            isActive
                                                ? "font-semibold text-foreground"
                                                : cn(
                                                      "font-medium",
                                                      labelStyles[state]
                                                  )
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
                </div>
            )}
        </nav>
    );
};

export default WizardProgress;
