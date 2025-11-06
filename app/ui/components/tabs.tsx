"use client";

import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/app/lib/utils";

type TabsProps = React.ComponentProps<typeof RadixTabs.Root>;
type TabsListProps = React.ComponentProps<typeof RadixTabs.List>;
type TabsTriggerProps = React.ComponentProps<typeof RadixTabs.Trigger>;
type TabsContentProps = React.ComponentProps<typeof RadixTabs.Content>;

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className, ...props }, ref) => (
  <RadixTabs.Root ref={ref} className={cn("w-full", className)} {...props} />
));
Tabs.displayName = "Tabs";

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md bg-transparent p-1 gap-2",
      className
    )}
    {...props}
    role="tablist"
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className, children, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lagunita disabled:opacity-50",
      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
      "data-[state=active]:bg-lagunita data-[state=active]:text-white",
      className
    )}
    {...props}
  >
    {children}
  </RadixTabs.Trigger>
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn("mt-4 w-full outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";