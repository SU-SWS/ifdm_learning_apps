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
  const hoverTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (open && contentRef.current) contentRef.current.focus();
  }, [open]);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    };
  }, []);

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const openWithHover = () => {
    clearHoverTimeout();
    setOpen(true);
  };

  const closeWithHoverDelay = (delay = 150) => {
    clearHoverTimeout();
    hoverTimeout.current = window.setTimeout(() => setOpen(false), delay);
  };

  // robust blur handler: use a microtask to check document.activeElement because relatedTarget can be null
  const handlePotentialClose = () => {
    // run after focus events settle
    setTimeout(() => {
      const active = document.activeElement;
      const insideContent = contentRef.current?.contains(active) ?? false;
      const insideTrigger = triggerRef.current?.contains(active) ?? false;
      if (!insideContent && !insideTrigger) {
        closeWithHoverDelay(0);
      } else {
        clearHoverTimeout();
      }
    }, 0);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={title}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lagunita"
          onPointerEnter={openWithHover}
          onPointerLeave={() => closeWithHoverDelay(150)}
          // remove unconditional onFocus to avoid re-opening after Escape
          // rely on keyboard opening via Enter/Space which Radix handles
        >
          <InfoIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="right"
          align="center"
          className="z-50 w-72 rounded-md border bg-white dark:bg-[#0b1220] p-4 shadow-lg"
          onPointerEnter={openWithHover}
          onPointerLeave={() => closeWithHoverDelay(150)}
          onFocus={clearHoverTimeout}
          onBlur={handlePotentialClose}
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
              <button
                onClick={() => setOpen(false)}
                className="text-sm px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-lagunita"
              >
                Close
              </button>
            </div>
          </div>
          <Popover.Arrow className="fill-white dark:fill-[#0b1220]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
