"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils/cn";

/**
 * Tabs на Radix UI unstyled + стили по pencil lanchHunter.pen.
 *
 * Горизонтальный pill-tabs:
 * - неактивная: text-fg-secondary, bg-transparent
 * - активная: bg-accent text-white, rounded-full
 *
 * Использование:
 *   <Tabs defaultValue="lunch">
 *     <TabsList>
 *       <TabsTrigger value="lunch">Ланчи</TabsTrigger>
 *       <TabsTrigger value="menu">Меню</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="lunch">...</TabsContent>
 *     <TabsContent value="menu">...</TabsContent>
 *   </Tabs>
 */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-secondary p-1",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 h-9 text-sm font-medium",
        "text-fg-secondary transition-colors",
        "hover:text-fg-primary",
        "data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md",
        className,
      )}
      {...props}
    />
  );
});
