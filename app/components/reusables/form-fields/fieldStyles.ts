/**
 * Shared layout for the labelled form rows in this directory.
 *
 * Every field used to hardcode a pixel width (`w-[13rem]`) inside a
 * non-wrapping flex row, which overflowed the viewport on phones. The rule
 * here is: stack label above control on mobile, pair them from `sm` up, and
 * never let the control have a fixed width below `sm`.
 *
 * IMPORTANT: the mobile branch of these classes is signed off and must not
 * change. Every rule below `sm:` is what a phone gets; desktop refinements
 * belong in the `sm:` half only.
 */

/*
 * From `sm` up this is a two-column grid rather than a flex row with
 * `justify-between`.
 *
 * The old row pushed a fixed 13rem control hard against the right edge and let
 * the label absorb all the slack, so a short label sat a long way from its
 * value — the pair read as two separate columns, a label rail and a control
 * rail, which is a large part of why the form felt like a dense table. A grid
 * keeps the value next to its label at any label length.
 */
export const fieldRow =
    "flex flex-col gap-1.5 text-sm sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-center sm:gap-4";

/** Control column: fluid on mobile, the grid's second track from sm up. */
export const fieldControl = "w-full min-w-0";

/** Wider variant, kept for textareas that want the full row. */
export const fieldControlWide = "w-full min-w-0";

/** Label column: the grid's first track from sm up. */
export const fieldLabel = "min-w-0";
