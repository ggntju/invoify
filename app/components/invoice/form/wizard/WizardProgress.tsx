"use client";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// React Wizard
import { WizardValues } from "react-use-wizard";

// ShadCn
import { Progress } from "@/components/ui/progress";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { AlertCircle, Check } from "lucide-react";

// Types
import { InvoiceType, WizardStepType } from "@/types";

type WizardProgressProps = {
    wizard: WizardValues;
};

/**
 * `partial` is the important one: a step the user has passed through but not
 * actually filled in. Previously any step behind the cursor rendered a green
 * check, because RHF validates on submit so `errors` is empty until then —
 * skipping ahead marked the whole form complete, which is a lie.
 */
type StepState = "invalid" | "active" | "complete" | "partial" | "upcoming";

const WizardProgress = ({ wizard }: WizardProgressProps) => {
    const { activeStep, stepCount, goToStep } = wizard;

    const {
        control,
        formState: { errors },
    } = useFormContext<InvoiceType>();

    // Actual field values, so completeness reflects what the user filled in
    // rather than merely the absence of validation errors.
    const values = useWatch({ control }) as InvoiceType;

    const { _t } = useTranslationContext();

    const filled = (value: unknown) =>
        typeof value === "string"
            ? value.trim().length > 0
            : value !== undefined && value !== null && value !== "";

    const allFilled = (...vals: unknown[]) => vals.every(filled);
    const anyFilled = (...vals: unknown[]) => vals.some(filled);

    const sender = values?.sender;
    const receiver = values?.receiver;
    const d = values?.details;

    const partyFields = (p?: InvoiceType["sender"]) => [
        p?.name,
        p?.address,
        p?.zipCode,
        p?.city,
        p?.country,
        p?.email,
        p?.phone,
    ];

    const step1Fields = [...partyFields(sender), ...partyFields(receiver)];
    const step2Fields = [
        d?.invoiceNumber,
        d?.invoiceDate,
        d?.dueDate,
        d?.currency,
    ];
    const items = d?.items ?? [];
    const step3Complete =
        items.length > 0 &&
        items.every(
            (i) =>
                filled(i?.name) &&
                Number(i?.quantity) > 0 &&
                Number(i?.unitPrice) > 0
        );
    const step3Started = items.some((i) => filled(i?.name));
    const pay = d?.paymentInformation;
    const step4Fields = [pay?.bankName, pay?.accountName, pay?.accountNumber];
    const step5Fields = [d?.paymentTerms];

    const step1Valid = !errors.sender && !errors.receiver;
    const step2Valid =
        !errors.details?.invoiceNumber &&
        !errors.details?.dueDate &&
        !errors.details?.invoiceDate &&
        !errors.details?.currency;

    const step3Valid = !errors.details?.items;
    const step4Valid = !errors.details?.paymentInformation;
    const step5Valid =
        !errors.details?.paymentTerms &&
        !errors.details?.subTotal &&
        !errors.details?.totalAmount &&
        !errors.details?.discountDetails?.amount &&
        !errors.details?.taxDetails?.amount &&
        !errors.details?.shippingDetails?.cost;

    type Step = WizardStepType & { isComplete: boolean; isStarted: boolean };

    const steps: Step[] = [
        {
            id: 0,
            label: _t("form.wizard.fromAndTo"),
            isValid: step1Valid,
            isComplete: allFilled(...step1Fields),
            isStarted: anyFilled(...step1Fields),
        },
        {
            id: 1,
            label: _t("form.wizard.invoiceDetails"),
            isValid: step2Valid,
            isComplete: allFilled(...step2Fields),
            isStarted: anyFilled(...step2Fields),
        },
        {
            id: 2,
            label: _t("form.wizard.lineItems"),
            isValid: step3Valid,
            isComplete: step3Complete,
            isStarted: step3Started,
        },
        {
            id: 3,
            label: _t("form.wizard.paymentInfo"),
            isValid: step4Valid,
            isComplete: allFilled(...step4Fields),
            isStarted: anyFilled(...step4Fields),
        },
        {
            id: 4,
            label: _t("form.wizard.summary"),
            isValid: step5Valid,
            isComplete: allFilled(...step5Fields),
            isStarted: anyFilled(...step5Fields),
        },
    ];

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

    const circleStyles: Record<StepState, string> = {
        invalid: "border-destructive bg-destructive text-destructive-foreground",
        active: "border-primary bg-primary text-primary-foreground",
        complete: "border-success bg-success text-success-foreground",
        // Started but unfinished: clearly "in progress", never mistakable for done
        partial: "border-primary bg-primary/10 text-primary",
        upcoming: "border-border bg-muted text-muted-foreground",
    };

    const labelStyles: Record<StepState, string> = {
        invalid: "text-destructive font-medium",
        active: "text-foreground font-medium",
        complete: "text-muted-foreground",
        partial: "text-foreground",
        upcoming: "text-muted-foreground",
    };

    const activeStepData = steps[activeStep];
    const activeStepState = activeStepData
        ? getStepState(activeStepData)
        : "upcoming";

    const renderCircleContent = (step: Step, state: StepState) => {
        if (state === "invalid") return <AlertCircle className="h-4 w-4" />;
        if (state === "complete") return <Check className="h-4 w-4" />;
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

    return (
        <nav aria-label={_t("form.wizard.progressLabel")}>
            {/* ---------- Mobile: counter + progress bar + compact dots ---------- */}
            <div className="md:hidden">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                        {activeStepData?.label}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {activeStep + 1} / {stepCount}
                    </span>
                </div>

                <Progress
                    value={((activeStep + 1) / stepCount) * 100}
                    indicatorClassName={cn(
                        activeStepState === "invalid" && "bg-destructive"
                    )}
                />

                <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                    {steps.map((step) => {
                        const state = getStepState(step);
                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => goToStep(step.id)}
                                aria-label={stepAriaLabel(step, state)}
                                aria-current={
                                    step.id === activeStep ? "step" : undefined
                                }
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                                    circleStyles[state]
                                )}
                            >
                                {renderCircleContent(step, state)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ---------- Desktop: numbered circles joined by connectors ---------- */}
            <ol className="hidden items-start md:flex">
                {steps.map((step, idx) => {
                    const state = getStepState(step);
                    const isLast = idx === steps.length - 1;

                    return (
                        <li
                            key={step.id}
                            className={cn(
                                "flex items-start",
                                !isLast && "flex-1"
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => goToStep(step.id)}
                                aria-label={stepAriaLabel(step, state)}
                                aria-current={
                                    step.id === activeStep ? "step" : undefined
                                }
                                className="group flex w-20 shrink-0 flex-col items-center gap-1.5 lg:w-24"
                            >
                                <span
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors group-hover:opacity-90",
                                        circleStyles[state]
                                    )}
                                >
                                    {renderCircleContent(step, state)}
                                </span>
                                <span
                                    className={cn(
                                        "text-center text-xs leading-tight transition-colors",
                                        labelStyles[state]
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>

                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "mt-[18px] h-0.5 min-w-4 flex-1 rounded-full transition-colors",
                                        step.isComplete
                                            ? "bg-success"
                                            : "bg-border"
                                    )}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default WizardProgress;
