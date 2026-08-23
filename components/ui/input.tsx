import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          /*
           * Quiet at rest, defined on interaction.
           *
           * A visible border on every field turned the form into a stack of
           * boxes — with fifteen fields on screen that is fifteen rectangles
           * competing with the invoice beside them. The field is now a soft
           * fill that gains a border on hover and a ring on focus, so
           * structure appears where the user is actually working.
           */
          "flex h-10 w-full rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm ring-offset-background transition-colors",
          "hover:border-input focus-visible:border-input focus-visible:bg-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Invalid fields keep a real border, since that is a state the user
          // needs to see without pointing at it.
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:bg-destructive/5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
