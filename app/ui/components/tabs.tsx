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
      "inline-flex items-center rounded-md bg-transparent p-1 gap-2 text-lagunita",
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
      "border-2 border-lagunita px-4 py-2 h-18 whitespace-normal items-center justify-center rounded-md font-bold ring-offset-background transition-colors", 
      "flex-none w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-lagunita data-[state=active]:text-white",
      "hover:bg-navy hover:text-white", 
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