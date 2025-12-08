"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { InfoIcon, X } from "lucide-react";

export default function InfoPopover({
  title = "Info",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open && contentRef.current) contentRef.current.focus();
  }, [open]);

  // Close when focus leaves both trigger and content
  const handleContentBlur = () => {
    // run after focus events settle
    setTimeout(() => {
      const active = document.activeElement;
      const insideContent = contentRef.current?.contains(active) ?? false;
      const insideTrigger = triggerRef.current?.contains(active) ?? false;
      if (!insideContent && !insideTrigger) setOpen(false);
    }, 0);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={title}
          className="p-1 rounded-md hover:bg-gray-100 cursor-pointer dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lagunita"
        >
          <InfoIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          className="z-50 w-72 center rounded-md border-2 border-lagunita  m-6 p-4 pt-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] bg-[var(--card-background)] rounded-3xl"
          onBlur={handleContentBlur}
        >
          <div
            ref={contentRef}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="info-popover-title"
            aria-describedby="info-popover-body"
            className="outline-none"
          >
            <a
              type="button"
              onClick={() => setOpen(false)}
              className="flex flex-row justify-end text-sm font-semibold p-0 mr-[-1em] underline text-[var(--popover-link)] hover:text-[var(--popover-link-hover)] hover:no-underline  
              cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-lagunita"
            >
              <X className="w-6 h-6 text-lagunita font-bold" />
            </a>
            <h3 id="info-popover-title" className="font-semibold text-sm mb-1 text-[var(--foreground)]">
              {title}
            </h3>
            <div id="info-popover-body" className="text-sm text-[var(--foreground)]">
              {children}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
