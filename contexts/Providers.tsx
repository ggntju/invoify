"use client";

import React, { useEffect } from "react";

// RHF
import { FormProvider, useForm } from "react-hook-form";

// Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { InvoiceSchema } from "@/lib/schemas";

// Radix
import { DirectionProvider } from "@radix-ui/react-direction";

// Next Intl
import { useLocale } from "next-intl";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { InvoiceContextProvider } from "@/contexts/InvoiceContext";
import { ChargesContextProvider } from "@/contexts/ChargesContext";

// Types
import { InvoiceType } from "@/types";

// Variables
import {
  FORM_DEFAULT_VALUES,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
  dirForLocale,
} from "@/lib/variables";

// Helpers
const readDraftFromLocalStorage = (): InvoiceType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // revive dates
    if (parsed?.details) {
      if (parsed.details.invoiceDate)
        parsed.details.invoiceDate = new Date(parsed.details.invoiceDate);
      if (parsed.details.dueDate)
        parsed.details.dueDate = new Date(parsed.details.dueDate);
    }
    return parsed;
  } catch {
    return null;
  }
};

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  /*
   * Radix reads direction from its own context, not from the document, so
   * without this its menus, popovers and tabs stay left-to-right on an RTL
   * page while everything around them mirrors.
   */
  const dir = dirForLocale(useLocale());

  const form = useForm<InvoiceType>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: FORM_DEFAULT_VALUES,
    /*
     * Default is "onSubmit", which meant `errors` stayed empty until a failed
     * submit — so the wizard could not distinguish "fine" from "not filled in
     * yet". onTouched surfaces problems as the user leaves a field, without
     * shouting at them mid-typing.
     */
    mode: "onTouched",
  });

  // Hydrate once on mount
  useEffect(() => {
    const draft = readDraftFromLocalStorage();
    if (draft) {
      form.reset(draft, { keepDefaultValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DirectionProvider dir={dir}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        <FormProvider {...form}>
          <InvoiceContextProvider>
            <ChargesContextProvider>{children}</ChargesContextProvider>
          </InvoiceContextProvider>
        </FormProvider>
      </TranslationProvider>
    </ThemeProvider>
    </DirectionProvider>
  );
};

export default Providers;
