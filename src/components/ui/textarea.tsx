import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border-2 border-input bg-card px-4 py-4 text-body font-body text-foreground shadow-[var(--shadow-sm)] placeholder:text-[hsl(25_15%_58%)] focus-visible:outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-[hsl(var(--disabled-surface))] disabled:text-[hsl(var(--disabled-content))]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
