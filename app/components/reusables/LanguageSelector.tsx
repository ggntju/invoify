"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

// Next Intl
// This useRouter/usePathname pair is wrapped with next-intl's locale handling
import { usePathname, useRouter } from "@/i18n/navigation";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, Globe } from "lucide-react";

// Variables
import { LOCALES } from "@/lib/variables";

type LanguageSelectorProps = {
    /**
     * `pill` is the compact navbar trigger: a globe and the locale code.
     * `block` is the full-width row used inside the mobile settings sheet,
     * where there is room for the language's own name.
     */
    variant?: "pill" | "block";
};

/**
 * Language switcher.
 *
 * Was a 10rem-wide `Select` with a BETA badge absolutely positioned so that it
 * hung outside the trigger's own bounds. It is now a pill sized to its content
 * — a globe and the two-letter code — which is what the navbar mockup calls
 * for and what leaves the invoice the widest thing on the page. The BETA badge
 * moved into the popover header, where it labels the whole translation set
 * rather than overlapping a control.
 */
const LanguageSelector = ({ variant = "pill" }: LanguageSelectorProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();

    const [open, setOpen] = useState(false);

    const current = String(params.locale ?? "");
    const active = LOCALES.find((locale) => locale.code === current);

    const handleLanguageChange = (lang: string) => {
        setOpen(false);
        /*
         * Switching language keeps you on the page you were on. The previous
         * version always pushed "/", so changing language from anywhere threw
         * away where you were.
         */
        router.replace(pathname, { locale: lang });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Languages"
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
                        variant === "pill"
                            ? "h-9 px-3"
                            : "h-10 w-full justify-between px-3"
                    )}
                >
                    <span className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4" />
                        {variant === "pill" ? (
                            <span className="font-medium uppercase">
                                {current}
                            </span>
                        ) : (
                            <span className="font-medium">
                                {active?.name ?? current}
                            </span>
                        )}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-56 p-1.5">
                <div className="mb-1 flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Languages
                    </span>
                    <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px] font-normal leading-none"
                    >
                        BETA
                    </Badge>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {LOCALES.map((locale) => {
                        const isActive = locale.code === current;
                        return (
                            <button
                                key={locale.code}
                                type="button"
                                onClick={() => handleLanguageChange(locale.code)}
                                className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                    isActive
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "hover:bg-muted"
                                )}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="w-7 shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">
                                        {locale.code}
                                    </span>
                                    <span className="truncate">
                                        {locale.name}
                                    </span>
                                </span>
                                {isActive && (
                                    <Check className="h-3.5 w-3.5 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default LanguageSelector;
