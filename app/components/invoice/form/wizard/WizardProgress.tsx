"use client";

// RHF
import { useFormContext } from "react-hook-form";

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

type StepState = "invalid" | "active" | "complete" | "upcoming";

const WizardProgress = ({ wizard }: WizardProgressProps) => {
    const { activeStep, stepCount, goToStep } = wizard;

    const {
        formState: { errors },
    } = useFormContext<InvoiceType>();

    const { _t } = useTranslationContext();

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

    const steps: WizardStepType[] = [
        { id: 0, label: _t("form.wizard.fromAndTo"), isValid: step1Valid },
        { id: 1, label: _t("form.wizard.invoiceDetails"), isValid: step2Valid },
        { id: 2, label: _t("form.wizard.lineItems"), isValid: step3Valid },
        { id: 3, label: _t("form.wizard.paymentInfo"), isValid: step4Valid },
        { id: 4, label: _t("form.wizard.summary"), isValid: step5Valid },
    ];

    /**
     * Resolves the visual state of a step. Invalid always wins so a step with
     * errors stays flagged even while it is the active one.
     */
    const getStepState = (step: WizardStepType): StepState => {
        if (!step.isValid) return "invalid";
        if (step.id === activeStep) return "active";
        if (step.id < activeStep) return "complete";
        return "upcoming";
    };

    const circleStyles: Record<StepState, string> = {
        invalid: "border-destructive bg-destructive text-destructive-foreground",
        active: "border-primary bg-primary text-primary-foreground",
        complete: "border-success bg-success text-success-foreground",
        upcoming: "border-border bg-muted text-muted-foreground",
    };

    const labelStyles: Record<StepState, string> = {
        invalid: "text-destructive font-medium",
        active: "text-foreground font-medium",
        complete: "text-muted-foreground",
        upcoming: "text-muted-foreground",
    };

    const activeStepData = steps[activeStep];
    const activeStepState = activeStepData
        ? getStepState(activeStepData)
        : "upcoming";

    const renderCircleContent = (step: WizardStepType, state: StepState) => {
        if (state === "invalid") return <AlertCircle className="h-4 w-4" />;
        if (state === "complete") return <Check className="h-4 w-4" />;
        return step.id + 1;
    };

    const stepAriaLabel = (step: WizardStepType, state: StepState) =>
        `${_t("form.wizard.stepLabel")} ${step.id + 1}: ${step.label}${
            state === "invalid" ? ` — ${_t("form.wizard.hasErrors")}` : ""
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
                                        step.id < activeStep
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
