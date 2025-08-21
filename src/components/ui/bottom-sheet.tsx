import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const bottomSheetVariants = cva(
  "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
  {
    variants: {
      size: {
        default: "max-h-[80vh]",
        large: "max-h-[90vh]",
        full: "h-screen",
      }
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface BottomSheetProps 
  extends React.ComponentPropsWithoutRef<typeof Sheet>,
    VariantProps<typeof bottomSheetVariants> {
  size?: "default" | "large" | "full"
}

const BottomSheet = React.forwardRef<
  React.ElementRef<typeof Sheet>,
  BottomSheetProps
>(({ size, ...props }, ref) => (
  <Sheet {...props} />
))
BottomSheet.displayName = "BottomSheet"

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  React.ComponentPropsWithoutRef<typeof SheetContent> & VariantProps<typeof bottomSheetVariants>
>(({ className, size, children, ...props }, ref) => (
  <SheetContent
    ref={ref}
    side="bottom"
    className={cn(bottomSheetVariants({ size }), className)}
    {...props}
  >
    {children}
  </SheetContent>
))
BottomSheetContent.displayName = "BottomSheetContent"

const BottomSheetHeader = SheetHeader
const BottomSheetTitle = SheetTitle
const BottomSheetDescription = SheetDescription

export {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
}