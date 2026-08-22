import React from "react";

// Helpers
import { formatDate, formatNumberWithCommas, isDataUrl } from "@/lib/helpers";

// Labels & theme
import type { InvoiceLabels } from "../invoiceLabels";
import { type InvoiceScale, type InvoiceTheme } from "../invoiceTheme";

// Types
import type { InvoiceType } from "@/types";

/**
 * Shared building blocks for the invoice layouts.
 *
 * Every layout composes these rather than repeating the markup — the two
 * original templates were near-identical 240-line files, so a fix to (say) the
 * conditional discount row had to be made twice. With ten layouts that would
 * have been ten times.
 *
 * These are plain functions of their props: no hooks, no context, because the
 * same components render server-side through renderToStaticMarkup for the PDF.
 */
export type PartCtx = {
    data: InvoiceType;
    labels: InvoiceLabels;
    theme: InvoiceTheme;
    scale: InvoiceScale;
};

const money = (value: unknown, currency: string) =>
    `${formatNumberWithCommas(Number(value ?? 0))} ${currency}`;

/* ------------------------------------------------------------------ */

export function Logo({ data }: PartCtx) {
    const { details, sender } = data;
    if (!details.invoiceLogo) return null;
    return (
        <img
            src={details.invoiceLogo}
            width={140}
            height={100}
            alt={`Logo of ${sender.name}`}
            style={{ maxHeight: 64, width: "auto", objectFit: "contain" }}
        />
    );
}

/** Sender or receiver address block. */
export function PartyBlock({
    ctx,
    party,
    heading,
    align = "left",
}: {
    ctx: PartCtx;
    party: InvoiceType["sender"] | InvoiceType["receiver"];
    heading?: string;
    align?: "left" | "right";
}) {
    const { scale } = ctx;
    return (
        <div className={align === "right" ? "text-right" : ""}>
            {heading && (
                <p
                    className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                >
                    {heading}
                </p>
            )}
            <p className={`${scale.name} mt-1 font-semibold text-gray-900`}>
                {party.name}
            </p>
            <address
                className={`${scale.body} mt-1 not-italic leading-relaxed text-gray-600`}
            >
                {party.address}
                {party.address && <br />}
                {[party.zipCode, party.city].filter(Boolean).join(", ")}
                <br />
                {party.country}
                {party.email && (
                    <>
                        <br />
                        {party.email}
                    </>
                )}
                {party.phone && (
                    <>
                        <br />
                        {party.phone}
                    </>
                )}
            </address>

            {party.customInputs?.map((input, i) => (
                <p key={i} className={`${scale.body} text-gray-600`}>
                    <span className="font-medium">{input.key}:</span>{" "}
                    {input.value}
                </p>
            ))}
        </div>
    );
}

/** Invoice number and the two dates, as label/value rows. */
export function DocumentMeta({
    ctx,
    align = "right",
}: {
    ctx: PartCtx;
    align?: "left" | "right";
}) {
    const { data, labels, scale } = ctx;
    const { details } = data;

    const rows = [
        [labels.invoiceNumber, details.invoiceNumber],
        [labels.invoiceDate, formatDate(details.invoiceDate)],
        [labels.dueDate, formatDate(details.dueDate)],
    ];

    return (
        <div className={align === "right" ? "text-right" : ""}>
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className={`${scale.body} flex gap-3 ${
                        align === "right" ? "justify-end" : ""
                    }`}
                >
                    <span className="font-medium text-gray-500">{label}:</span>
                    <span className="tabular-nums text-gray-900">{value}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */

export type ItemsTableProps = {
    ctx: PartCtx;
    /** Fills the header row with the accent instead of a hairline rule. */
    variant?: "rule" | "filled" | "plain";
};

export function ItemsTable({ ctx, variant = "rule" }: ItemsTableProps) {
    const { data, labels, theme, scale } = ctx;
    const { details } = data;

    const headFilled = variant === "filled";

    return (
        <table className="w-full border-collapse">
            <thead>
                <tr
                    style={
                        headFilled
                            ? { backgroundColor: theme.accentColor }
                            : undefined
                    }
                >
                    {[labels.item, labels.qty, labels.rate, labels.amount].map(
                        (h, i) => (
                            <th
                                key={h}
                                className={[
                                    scale.label,
                                    "font-semibold uppercase tracking-wider",
                                    headFilled ? "px-2 py-2" : "pb-2",
                                    i === 0 ? "text-left" : "text-right",
                                    variant === "rule"
                                        ? "border-b-2 border-gray-300"
                                        : "",
                                ].join(" ")}
                                style={
                                    headFilled
                                        ? { color: "#ffffff" }
                                        : { color: theme.accentColor }
                                }
                            >
                                {h}
                            </th>
                        )
                    )}
                </tr>
            </thead>
            <tbody>
                {details.items.map((item, index) => (
                    <tr
                        key={index}
                        className={
                            variant === "plain"
                                ? ""
                                : "border-b border-gray-200"
                        }
                    >
                        <td className={`${scale.rowY} ${headFilled ? "px-2" : ""} align-top`}>
                            <p
                                className={`${scale.body} font-medium text-gray-900`}
                            >
                                {item.name}
                            </p>
                            {item.description && (
                                <p
                                    className={`${scale.label} whitespace-pre-line text-gray-500`}
                                >
                                    {item.description}
                                </p>
                            )}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap text-right align-top tabular-nums text-gray-700`}
                        >
                            {item.quantity}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap text-right align-top tabular-nums text-gray-700`}
                        >
                            {money(item.unitPrice, details.currency)}
                        </td>
                        <td
                            className={`${scale.rowY} ${headFilled ? "px-2" : ""} ${scale.body} whitespace-nowrap text-right align-top font-medium tabular-nums text-gray-900`}
                        >
                            {money(item.total, details.currency)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ------------------------------------------------------------------ */

export function TotalsBlock({
    ctx,
    emphasis = "rule",
}: {
    ctx: PartCtx;
    /** `fill` paints the grand total row with a tint of the accent. */
    emphasis?: "rule" | "fill";
}) {
    const { data, labels, theme, scale } = ctx;
    const { details } = data;

    const rows: [string, string][] = [
        [labels.subtotal, money(details.subTotal, details.currency)],
    ];

    if (details.discountDetails?.amount) {
        rows.push([
            labels.discount,
            details.discountDetails.amountType === "amount"
                ? `- ${money(details.discountDetails.amount, details.currency)}`
                : `- ${details.discountDetails.amount}%`,
        ]);
    }
    if (details.taxDetails?.amount) {
        rows.push([
            labels.tax,
            details.taxDetails.amountType === "amount"
                ? `+ ${money(details.taxDetails.amount, details.currency)}`
                : `+ ${details.taxDetails.amount}%`,
        ]);
    }
    if (details.shippingDetails?.cost) {
        rows.push([
            labels.shipping,
            details.shippingDetails.costType === "amount"
                ? `+ ${money(details.shippingDetails.cost, details.currency)}`
                : `+ ${details.shippingDetails.cost}%`,
        ]);
    }

    return (
        <div className="w-full">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className={`${scale.body} flex justify-between gap-6 py-1 text-gray-600`}
                >
                    <span>{label}</span>
                    <span className="tabular-nums">{value}</span>
                </div>
            ))}

            <div
                className={`mt-1 flex items-baseline justify-between gap-6 ${
                    emphasis === "fill"
                        ? "rounded px-3 py-2"
                        : "border-t-2 pt-2"
                }`}
                style={
                    emphasis === "fill"
                        ? { backgroundColor: theme.accentColor, color: "#fff" }
                        : { borderColor: theme.accentColor }
                }
            >
                <span className={`${scale.body} font-semibold uppercase tracking-wide`}>
                    {labels.total}
                </span>
                <span className={`${scale.total} font-bold tabular-nums`}>
                    {money(details.totalAmount, details.currency)}
                </span>
            </div>

            {details.totalAmountInWords && (
                <p className={`${scale.label} mt-1.5 italic text-gray-500`}>
                    {labels.totalInWords}: {details.totalAmountInWords}{" "}
                    {details.currency}
                </p>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function PaymentBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    const pay = data.details.paymentInformation;
    if (!pay?.bankName && !pay?.accountName && !pay?.accountNumber) return null;

    return (
        <div>
            <p
                className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
            >
                {labels.paymentInfoHeading}
            </p>
            <div className={`${scale.body} mt-1 text-gray-700`}>
                {pay?.bankName && (
                    <p>
                        {labels.bankName}: {pay.bankName}
                    </p>
                )}
                {pay?.accountName && (
                    <p>
                        {labels.accountName}: {pay.accountName}
                    </p>
                )}
                {pay?.accountNumber && (
                    <p className="tabular-nums">
                        {labels.accountNumber}: {pay.accountNumber}
                    </p>
                )}
            </div>
        </div>
    );
}

export function NotesBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    const { details } = data;
    if (!details.additionalNotes && !details.paymentTerms) return null;

    return (
        <div className="space-y-2">
            {details.paymentTerms && (
                <div>
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.paymentTerms}
                    </p>
                    <p className={`${scale.body} text-gray-700`}>
                        {details.paymentTerms}
                    </p>
                </div>
            )}
            {details.additionalNotes && (
                <div>
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.additionalNotes}
                    </p>
                    <p
                        className={`${scale.body} whitespace-pre-line text-gray-700`}
                    >
                        {details.additionalNotes}
                    </p>
                </div>
            )}
        </div>
    );
}

export function SignatureBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    const { details, sender } = data;
    const signature = details.signature?.data;
    if (!signature) return null;

    return (
        <div>
            <p
                className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
            >
                {labels.signature}
            </p>
            {isDataUrl(signature) ? (
                <img
                    src={signature}
                    width={120}
                    height={60}
                    alt={`Signature of ${sender.name}`}
                    style={{ maxHeight: 56, width: "auto" }}
                />
            ) : (
                <p
                    style={{
                        fontSize: 26,
                        fontFamily: `${details.signature?.fontFamily ?? "cursive"}, cursive`,
                        color: "#111827",
                        lineHeight: 1.2,
                    }}
                >
                    {signature}
                </p>
            )}
        </div>
    );
}

export function ContactFooter({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    const { sender } = data;
    return (
        <div className={`${scale.label} text-gray-500`}>
            <p>{labels.contactHeading}</p>
            <p className="mt-0.5 font-medium text-gray-700">
                {[sender.email, sender.phone].filter(Boolean).join(" · ")}
            </p>
        </div>
    );
}
