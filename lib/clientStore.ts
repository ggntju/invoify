import type { InvoiceType } from "@/types";

/**
 * Saved clients ("bill to" parties), kept in the browser.
 *
 * Same place and same shape of storage as the saved invoices this app already
 * keeps — nothing is sent to a server, because there is no account to send it
 * to. Isolated here as plain functions so both the picker and the save action
 * read one implementation, and so the parsing stays defensive: this is user
 * data that may have been written by an older version of the app, or edited by
 * hand in devtools.
 */
export const CLIENTS_STORAGE_KEY = "invoify:clients";

export type SavedClient = InvoiceType["receiver"] & {
    /** Stable id, so renaming a client does not orphan it. */
    id: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

/** Accepts only entries that have the shape we can actually render. */
function normalise(entry: unknown): SavedClient | null {
    if (!isRecord(entry)) return null;
    const name = entry.name;
    if (typeof name !== "string" || name.trim().length === 0) return null;

    const str = (key: string) =>
        typeof entry[key] === "string" ? (entry[key] as string) : "";

    return {
        id: typeof entry.id === "string" && entry.id ? entry.id : crypto.randomUUID(),
        name,
        address: str("address"),
        zipCode: str("zipCode"),
        city: str("city"),
        country: str("country"),
        email: str("email"),
        phone: str("phone"),
        customInputs: Array.isArray(entry.customInputs)
            ? (entry.customInputs as SavedClient["customInputs"])
            : [],
    };
}

export function readClients(): SavedClient[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalise).filter((c): c is SavedClient => c !== null);
    } catch {
        return [];
    }
}

function writeClients(clients: SavedClient[]): SavedClient[] {
    if (typeof window === "undefined") return clients;
    try {
        window.localStorage.setItem(
            CLIENTS_STORAGE_KEY,
            JSON.stringify(clients)
        );
    } catch {
        // Quota or disabled storage. The address book is a convenience; losing
        // a write must not interrupt the invoice being worked on.
    }
    return clients;
}

/**
 * Saves a receiver, replacing any existing entry with the same name.
 *
 * Matching on name rather than always appending, because the realistic mistake
 * is invoicing the same client twice and ending up with two near-identical
 * rows in the picker.
 */
export function saveClient(receiver: InvoiceType["receiver"]): SavedClient[] {
    const candidate = normalise({ ...receiver, id: undefined });
    if (!candidate) return readClients();

    const existing = readClients();
    const index = existing.findIndex(
        (client) =>
            client.name.trim().toLowerCase() ===
            candidate.name.trim().toLowerCase()
    );

    if (index === -1) {
        return writeClients([...existing, candidate]);
    }

    const merged = [...existing];
    merged[index] = { ...candidate, id: existing[index].id };
    return writeClients(merged);
}

export function deleteClient(id: string): SavedClient[] {
    return writeClients(readClients().filter((client) => client.id !== id));
}
