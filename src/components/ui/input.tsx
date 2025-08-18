import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-2xl border-2 border-input bg-card px-5 py-4 text-body font-body text-foreground shadow-[var(--shadow-sm)] placeholder:text-[hsl(25_15%_58%)] focus-visible:outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-[hsl(var(--disabled-surface))] disabled:text-[hsl(var(--disabled-content))] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
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
