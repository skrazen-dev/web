import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: micro-interaction on active (scale + shadow) + smooth ease-out
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-[160ms] cubic-bezier(0.23,1,0.32,1) disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary: Blue gradient with glow
        default:
          "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(37,99,235,0.3)]",
        // Destructive: Red gradient
        destructive:
          "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[0_4px_12px_rgba(239,68,68,0.35)] hover:shadow-[0_6px_18px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 active:translate-y-0",
        // Outline: Glass style
        outline:
          "border border-[rgba(148,163,184,0.15)] bg-transparent text-slate-300 hover:bg-slate-800/60 hover:border-[rgba(148,163,184,0.25)] hover:text-white active:bg-slate-800/80",
        // Secondary: Muted dark
        secondary:
          "bg-slate-800/80 text-slate-200 border border-[rgba(148,163,184,0.08)] hover:bg-slate-700/80 hover:text-white",
        // Ghost: Minimal
        ghost:
          "text-slate-400 hover:bg-slate-800/60 hover:text-white",
        // Link
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        // Pink accent
        pink:
          "bg-gradient-to-br from-pink-500 to-pink-700 text-white shadow-[0_4px_14px_rgba(236,72,153,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.55)] hover:-translate-y-0.5 active:translate-y-0",
        // Success green
        success:
          "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0",
        // Warning amber
        warning:
          "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_18px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 active:translate-y-0",
        // Ghost blue tinted
        "ghost-blue":
          "bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/18 hover:border-blue-500/35 hover:text-blue-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-base has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-8 text-base",
        icon: "size-9",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
