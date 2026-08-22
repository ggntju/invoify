"use client";

import { useParams } from "next/navigation";

// Next Intl
import { useRouter } from "@/i18n/navigation"; // This useRouter is wrapped with next/navigation useRouter

// ShadCn
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Variables
import { LOCALES } from "@/lib/variables";

const LanguageSelector = () => {
    const router = useRouter();
    const params = useParams();

    const handleLanguageChange = (lang: string) => {
        router.push("/", { locale: lang });
    };
    return (
        <Select
            value={params.locale!.toLocaleString()}
            onValueChange={(lang) => handleLanguageChange(lang)}
        >
            {/* `position: absolute` inside className was not a valid utility */}
            <SelectTrigger
                className="relative w-full sm:w-[10rem]"
                aria-label="Languages"
            >
                <Badge
                    variant="secondary"
                    className="absolute -top-2.5 left-2 h-4 px-1.5 text-[10px] font-normal leading-none"
                >
                    BETA
                </Badge>
                <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent className="max-h-[60vh] overflow-y-auto">
                <SelectGroup>
                    <SelectLabel>Languages</SelectLabel>

                    {LOCALES.map((locale) => (
                        <SelectItem key={locale.code} value={locale.code}>
                            {locale.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

export default LanguageSelector;
