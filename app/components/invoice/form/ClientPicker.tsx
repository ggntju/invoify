"use client";

import { useCallback, useEffect, useState } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import useToasts from "@/hooks/useToasts";

// Store
import {
    deleteClient,
    readClients,
    saveClient,
    type SavedClient,
} from "@/lib/clientStore";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, Contact, Trash2, UserPlus } from "lucide-react";

// Types
import type { InvoiceType } from "@/types";

/**
 * Save and reuse the party you are invoicing.
 *
 * The single biggest time-saver for anyone who invoices the same people:
 * without it, every repeat invoice means retyping seven address fields
 * verbatim. Stored in the browser alongside the saved invoices — see
 * lib/clientStore.ts
 */
const ClientPicker = () => {
    const { getValues, setValue, watch } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const { clientSaved, clientRemoved } = useToasts();

    const [clients, setClients] = useState<SavedClient[]>([]);
    const [open, setOpen] = useState(false);

    /*
     * Read on mount rather than during render: localStorage is not available on
     * the server, and reading it while rendering would make the first client
     * render disagree with the prerendered HTML.
     */
    useEffect(() => {
        setClients(readClients());
    }, []);

    const receiverName = watch("receiver.name");
    const canSave = Boolean(receiverName?.trim());

    const handleSave = useCallback(() => {
        const receiver = getValues("receiver");
        setClients(saveClient(receiver));
        clientSaved(receiver.name);
    }, [getValues, setValue, clientSaved]);

    const handlePick = useCallback(
        (client: SavedClient) => {
            setOpen(false);
            /*
             * `id` is ours, not a form field — spreading it into the form would
             * put an unknown key into the invoice and fail schema validation on
             * the way to the PDF.
             */
            const { id: _id, ...receiver } = client;
            setValue("receiver", receiver, {
                shouldDirty: true,
                shouldValidate: true,
            });
        },
        [setValue]
    );

    const handleDelete = useCallback(
        (event: React.MouseEvent, client: SavedClient) => {
            // The row itself selects the client; the bin must not do both.
            event.stopPropagation();
            setClients(deleteClient(client.id));
            clientRemoved(client.name);
        },
        [clientRemoved]
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <BaseButton
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={clients.length === 0}
                        tooltipLabel={
                            clients.length === 0
                                ? _t("clients.emptyTooltip")
                                : _t("clients.pickTooltip")
                        }
                    >
                        <Contact className="h-4 w-4" />
                        {_t("clients.pick")}
                        {clients.length > 0 && (
                            <span className="text-muted-foreground">
                                ({clients.length})
                            </span>
                        )}
                    </BaseButton>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-72 p-1.5">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {_t("clients.heading")}
                    </p>

                    <div className="max-h-[50vh] overflow-y-auto">
                        {clients.map((client) => (
                            <div
                                key={client.id}
                                className="group flex items-center gap-1 rounded-md hover:bg-muted"
                            >
                                <button
                                    type="button"
                                    onClick={() => handlePick(client)}
                                    className="min-w-0 flex-1 px-2 py-1.5 text-left"
                                >
                                    <span className="block truncate text-sm font-medium">
                                        {client.name}
                                    </span>
                                    {(client.city || client.country) && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {[client.city, client.country]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={(event) =>
                                        handleDelete(event, client)
                                    }
                                    aria-label={`${_t("clients.remove")} ${client.name}`}
                                    className={cn(
                                        "mr-1 rounded p-1.5 text-muted-foreground transition-colors",
                                        "hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <BaseButton
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={!canSave}
                onClick={handleSave}
                tooltipLabel={_t("clients.saveTooltip")}
            >
                <UserPlus className="h-4 w-4" />
                {_t("clients.save")}
            </BaseButton>

            {clients.some(
                (client) =>
                    client.name.trim().toLowerCase() ===
                    receiverName?.trim().toLowerCase()
            ) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-success" />
                    {_t("clients.saved")}
                </span>
            )}
        </div>
    );
};

export default ClientPicker;
