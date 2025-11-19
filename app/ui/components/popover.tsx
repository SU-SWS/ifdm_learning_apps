"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { InfoIcon } from "lucide-react";

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
      <Popover.Anchor asChild>
        <div className="row">
          <Popover.Trigger className="hidden">Trigger</Popover.Trigger>
        </div>
      </Popover.Anchor>
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
          side="right"
          align="center"
          className="z-50 w-72 rounded-md border-2 border-lagunita  m-6 p-4 shadow-lg bg-[var(--card-background)] rounded-3xl"
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
            <h3 id="info-popover-title" className="font-semibold text-sm mb-1 text-[var(--foreground)]">
              {title}
            </h3>
            <div id="info-popover-body" className="text-sm text-[var(--foreground)]">
              {children}
            </div>

            <div className="mt-3 flex justify-end">
              <a
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold px-3 py-1 underline text-[var(--popover-link)] hover:text-[var(--popover-link-hover)] hover:no-underline  
                cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-lagunita"
              >
                Close
              </a>
            </div>
          </div>
          <Popover.Arrow className="fill-white dark:fill-[#0b1220]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
