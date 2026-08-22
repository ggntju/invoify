// Components
import { BaseFooter, BaseNavbar } from "@/app/components";
// ShadCn
import { Toaster } from "@/components/ui/toaster";
// Contexts
import Providers from "@/contexts/Providers";
// Fonts
import {
    alexBrush,
    dancingScript,
    greatVibes,
    outfit,
    parisienne,
} from "@/lib/fonts";
// SEO
import { JSONLD, ROOTKEYWORDS } from "@/lib/seo";
// Variables
import { BASE_URL, GOOGLE_SC_VERIFICATION, LOCALES } from "@/lib/variables";
// Favicon
import Favicon from "@/public/assets/favicon/favicon.ico";
// Vercel Analytics
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import Script from "next/script";
// Next Intl
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/i18n/messages";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: "Invoify | Free Invoice Generator",
    description:
        "Create invoices effortlessly with Invoify, the free invoice generator. Try it now!",
    icons: [{ rel: "icon", url: Favicon.src }],
    keywords: ROOTKEYWORDS,
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: BASE_URL,
    },
    authors: {
        name: "Ali Abbasov",
        url: "https://aliabb.vercel.app",
    },
    verification: {
        google: GOOGLE_SC_VERIFICATION,
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export function generateStaticParams() {
    // Next.js expects an array of objects: [{ locale: 'en' },
    // ...]
    const locales = LOCALES.map((locale) => ({ locale: locale.code }));
    return locales;
}

export default async function LocaleLayout(props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const params = await props.params;

    const { locale } = params;

    const { children } = props;

    let messages;
    try {
        // English-backed so a key missing from a translation renders readable
        // copy instead of an error. See i18n/messages.ts
        messages = await getMessages(locale);
    } catch {
        notFound();
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <head suppressHydrationWarning>
                <script
                    type="application/ld+json"
                    id="json-ld"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
                />
            </head>
            <body
                className={`${outfit.className} ${dancingScript.variable} ${parisienne.variable} ${greatVibes.variable} ${alexBrush.variable} antialiased min-h-dvh bg-background text-foreground`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers>
                        <BaseNavbar />

                        <div className="flex flex-col">{children}</div>

                        <BaseFooter />

                        {/* Toast component */}
                        <Toaster />

                        {/* Vercel analytics */}
                        <Analytics />

                        {/*
                         * Buy Me a Coffee widget. Loaded via next/script with
                         * lazyOnload so this third party does not block parsing
                         * — it was previously a synchronous <script> in <head>.
                         */}
                        <Script
                            src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
                            strategy="lazyOnload"
                            data-name="BMC-Widget"
                            data-cfasync="false"
                            data-id="aliabb"
                            data-description="Support me on Buy me a coffee!"
                            data-message="Thank you for using Invoify"
                            data-color="#5F7FFF"
                            data-position="Right"
                            data-x_margin="18"
                            data-y_margin="18"
                        />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
