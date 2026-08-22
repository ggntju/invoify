"use client";

import React from "react";

// React Wizard
import { useWizard } from "react-use-wizard";

// Components
import { WizardNavigation, WizardProgress } from "@/app/components";

type WizardStepProps = {
    children: React.ReactNode;
};

const WizardStep = ({ children }: WizardStepProps) => {
    const wizard = useWizard();

    return (
        <div className="flex min-h-[18rem] flex-col md:min-h-[22rem]">
            <WizardProgress wizard={wizard} />
            <div className="flex-1">{children}</div>
            <WizardNavigation />
        </div>
    );
};

export default WizardStep;
