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

    /*
     * Actual field values, so completeness reflects what the user filled in
     * rather than merely the absence of validation errors.
     *
     * Narrowed from `useWatch({ control })`. The full-form version re-rendered
     * this component — which every wizard step mounts — on every keystroke in
     * the invoice, including fields no step's completeness depends on (the
     * logo, the signature, the theme, the totals). These are the only paths
     * the predicates below read.
     */
    const [
        sender,
        receiver,
        invoiceNumber,
        invoiceDate,
        dueDate,
        currency,
        items,
        paymentInformation,
        paymentTerms,
    ] = useWatch({
        control,
        name: [
            "sender",
            "receiver",
            "details.invoiceNumber",
            "details.invoiceDate",
            "details.dueDate",
            "details.currency",
            "details.items",
            "details.paymentInformation",
            "details.paymentTerms",
        ],
    });

    const { _t } = useTranslationContext();

    const filled = (value: unknown) =>
        typeof value === "string"
            ? value.trim().length > 0
            : value !== undefined && value !== null && value !== "";

    const allFilled = (...vals: unknown[]) => vals.every(filled);
    const anyFilled = (...vals: unknown[]) => vals.some(filled);

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
    const step2Fields = [invoiceNumber, invoiceDate, dueDate, currency];
    const lineItems = items ?? [];
    const step3Complete =
        lineItems.length > 0 &&
        lineItems.every(
            (i) =>
                filled(i?.name) &&
                Number(i?.quantity) > 0 &&
                Number(i?.unitPrice) > 0
        );
    const step3Started = lineItems.some((i) => filled(i?.name));
    const step4Fields = [
        paymentInformation?.bankName,
        paymentInformation?.accountName,
        paymentInformation?.accountNumber,
    ];
    const step5Fields = [paymentTerms];

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

    const dotStyles: Record<StepState, string> = {
        invalid: "border-destructive bg-destructive text-destructive-foreground",
        active: "border-primary bg-primary text-primary-foreground",
        complete: "border-success bg-success text-success-foreground",
        // Started but unfinished: clearly in progress, never mistakable for done
        partial: "border-primary bg-primary/15 text-primary",
        upcoming: "border-border bg-muted text-muted-foreground",
    };

    const activeStepData = steps[activeStep];
    const activeStepState = activeStepData
        ? getStepState(activeStepData)
        : "upcoming";

    const renderDotContent = (
        step: Step,
        state: StepState,
        isActive: boolean
    ) => {
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
     * Direction A: the stepper is deliberately quiet. It used to be a row of
     * five full-label buttons plus connector lines — a band of chrome above
     * every step. It is now a single progress rule with the current step named
     * beside it, and small state dots for jumping.
     *
     * The four-state colouring is kept, because that is what tells you whether
     * a step is genuinely finished; it just no longer shouts.
     */
    return (
        <nav aria-label={_t("form.wizard.progressLabel")} className="mb-6">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">
                    {activeStepData?.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {_t("form.wizard.stepLabel")} {activeStep + 1} / {stepCount}
                </span>
            </div>

            <Progress
                value={((activeStep + 1) / stepCount) * 100}
                indicatorClassName={cn(
                    activeStepState === "invalid" && "bg-destructive"
                )}
            />

            <ol className="mt-3 flex items-center gap-1.5">
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
                                title={step.label}
                                className={cn(
                                    "flex items-center justify-center rounded-full border text-[11px] font-semibold transition-all",
                                    // The active step is a labelled pill; the
                                    // rest are dots, so the row stays calm.
                                    isActive
                                        ? "h-6 px-2.5"
                                        : "h-6 w-6 hover:opacity-80",
                                    dotStyles[state]
                                )}
                            >
                                {renderDotContent(step, state, isActive)}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default WizardProgress;
