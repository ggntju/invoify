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
    const { isFirstStep, isLastStep, previousStep, nextStep } = useWizard();

    const { _t } = useTranslationContext();

    /*
     * A single hairline instead of the bordered footer this used to sit in.
     * "Next" is the one obvious action on every step except the last, where the
     * primary action becomes Generate PDF in the action bar.
     */
    return (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            {!isFirstStep ? (
                <BaseButton
                    variant="ghost"
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
