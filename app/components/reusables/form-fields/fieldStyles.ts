/**
 * Shared layout for the labelled form rows in this directory.
 *
 * Every field used to hardcode a pixel width (`w-[13rem]`) inside a
 * non-wrapping flex row, which overflowed the viewport on phones. The rule
 * here is: stack label above control on mobile, align them side by side from
 * `sm` up, and never let the control have a fixed width below `sm`.
 */

/** Row wrapper: stacked on mobile, label/control side by side from sm up. */
export const fieldRow =
    "flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4";

/** Control column: fluid on mobile, fixed and non-shrinking from sm up. */
export const fieldControl = "w-full min-w-0 sm:w-[13rem] sm:shrink-0";

/** Wider variant, for textareas. */
export const fieldControlWide = "w-full min-w-0 sm:w-[15rem] sm:shrink-0";

/** Label column: takes the remaining space so controls stay right-aligned. */
export const fieldLabel = "sm:flex-1";
