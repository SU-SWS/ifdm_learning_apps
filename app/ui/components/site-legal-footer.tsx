"use client";

import { usePathname } from "next/navigation";
import { LegalDisclaimerFooter } from "@/app/ui/components/legal-disclaimer-footer";

// The landing page places the footer itself, so skip it here to avoid a duplicate.
export function SiteLegalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <LegalDisclaimerFooter />;
}
