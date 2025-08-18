import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap text-button font-body ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-[hsl(215_35%_20%)] active:bg-[hsl(215_40%_15%)] active:scale-[0.99] disabled:bg-[hsl(var(--disabled-surface))] disabled:text-[hsl(var(--disabled-content))]",
        primary: "bg-secondary text-secondary-foreground hover:bg-[hsl(215_35%_20%)] active:bg-[hsl(215_40%_15%)] active:scale-[0.99] disabled:bg-[hsl(var(--disabled-surface))] disabled:text-[hsl(var(--disabled-content))]",
        secondary:
          "bg-transparent text-primary border-2 border-primary hover:bg-[hsl(8_38%_49%_/_0.06)] active:bg-[hsl(8_38%_49%_/_0.10)] active:scale-[0.99] disabled:text-[hsl(var(--disabled-content))] disabled:border-[hsl(var(--disabled-content))]",
        outline:
          "bg-transparent text-secondary border-2 border-secondary hover:bg-[hsl(215_29%_26%_/_0.06)] active:bg-[hsl(215_29%_26%_/_0.10)] active:scale-[0.99] disabled:text-[hsl(var(--disabled-content))] disabled:border-[hsl(var(--disabled-content))]",
        tertiary: "bg-transparent text-secondary hover:text-[hsl(215_35%_20%)] active:text-[hsl(215_40%_15%)]",
        link: "bg-transparent text-secondary underline hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-[hsl(var(--disabled-surface))] disabled:text-[hsl(var(--disabled-content))]",
        ghost: "hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-12 px-6 py-4 rounded-xl min-h-[48px]",
        sm: "h-10 px-5 py-3 rounded-xl min-h-[40px]",
        md: "h-12 px-6 py-4 rounded-xl min-h-[48px]",
        lg: "h-14 px-8 py-5 rounded-2xl min-h-[56px]",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
