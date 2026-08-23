// Components
import { InvoiceMain } from "@/app/components";
import LandingContent from "@/app/components/layout/LandingContent";

// Contexts
import { WizardProvider } from "@/contexts/WizardContext";

export default async function Home(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;

    return (
        <>
            {/* `pb-28 xl:pb-10` clears the sticky MobileActionBar, which only
                renders below xl. */}
            <main className="container py-6 pb-28 md:py-10 xl:pb-10">
                {/*
                 * No Suspense boundary: WizardProvider reads the step from
                 * window.location rather than useSearchParams, so this page
                 * stays statically prerendered. See contexts/WizardContext.tsx
                 */}
                <WizardProvider>
                    <InvoiceMain />
                </WizardProvider>
            </main>

            {/*
             * Below the fold, and below the viewport-height shell — the app
             * never scrolls past its own work, but there is now something on
             * the page for a crawler to read.
             */}
            <LandingContent locale={locale} />
        </>
    );
}
