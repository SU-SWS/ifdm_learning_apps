import * as React from "react"
import { cn } from "@/app/lib/utils"

const LegalDisclaimerFooter = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <footer
    ref={ref}
    className={cn(
      "mx-auto w-full max-w-5xl px-6 pt-6 pb-[calc(var(--sticky-footer-height,0px)+1.5rem)] text-sm text-muted-foreground md:pb-6",
      className
    )}
    {...props}
  >
    <div className="bg-[var(--card-background)] rounded-lg p-[32px] [.dark_&]:text-white">
      This calculator provides estimates for educational purposes only. It is not financial, legal, tax, or investment advice. Results are illustrations based on simplified assumptions and the inputs you provide, and may not reflect your circumstances. Consult a qualified professional before making financial decisions.
    </div>
  </footer>
))
LegalDisclaimerFooter.displayName = "LegalDisclaimerFooter"

export { LegalDisclaimerFooter }
