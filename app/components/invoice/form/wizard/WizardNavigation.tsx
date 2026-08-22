"use client";

// React Wizard
import { useWizard } from "react-use-wizard";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { ArrowLeft, ArrowRight } from "lucide-react";

const WizardNavigation = () => {
    const { isFirstStep, isLastStep, handleStep, previousStep, nextStep } =
        useWizard();

    const { _t } = useTranslationContext();
    return (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            {!isFirstStep ? (
                <BaseButton
                    variant="outline"
                    tooltipLabel={_t("form.wizard.backTooltip")}
                    onClick={previousStep}
                >
                    <ArrowLeft className="h-4 w-4" />
                    {_t("form.wizard.back")}
                </BaseButton>
            ) : (
                // Keeps "Next" right-aligned on the first step
                <span />
            )}

            {!isLastStep && (
                <BaseButton
                    tooltipLabel={_t("form.wizard.nextTooltip")}
                    onClick={nextStep}
                >
                    {_t("form.wizard.next")}
                    <ArrowRight className="h-4 w-4" />
                </BaseButton>
            )}
        </div>
    );
};

export default WizardNavigation;
