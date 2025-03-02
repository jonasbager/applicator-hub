"use client"

import * as React from "react";
import { cn } from "../../lib/utils";

interface AuroraButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  glowClassName?: string;
}

export function AuroraButton({
  className,
  children,
  glowClassName,
  ...props
}: AuroraButtonProps) {
  return (
    <div className="relative">
      {/* Gradient border container */}
      <div
        className={cn(
          "absolute -inset-[2px] rounded-lg bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 opacity-75 blur-lg transition-all",
          "group-hover:opacity-100 group-hover:blur-xl",
          glowClassName
        )}
      />

      {/* Button */}
      <button
        className={cn(
          "relative rounded-lg bg-sky-500 px-4 py-2",
          "text-white shadow-xl",
          "transition-all hover:bg-sky-600",
          "group border border-sky-400",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
