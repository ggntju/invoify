// Components
import { InvoiceMain } from "@/app/components";

// Contexts
import { WizardProvider } from "@/contexts/WizardContext";

export default function Home() {
    // `pb-28 xl:pb-10` clears the sticky MobileActionBar, which only renders
    // below xl.
    return (
        <main className="container py-6 pb-28 md:py-10 xl:pb-10">
            {/*
             * No Suspense boundary: WizardProvider reads the step from
             * window.location rather than useSearchParams, so this page stays
             * statically prerendered. See contexts/WizardContext.tsx
             */}
            <WizardProvider>
                <InvoiceMain />
            </WizardProvider>
        </main>
    );
}
