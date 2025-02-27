import React from 'react';
import { cn } from "../../lib/utils";

interface BubbleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const BubbleButton = React.forwardRef<HTMLButtonElement, BubbleButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative w-full px-6 py-2.5 bg-sky-500 text-white rounded-lg font-medium",
          "transition-all duration-200 hover:bg-sky-600 active:scale-95",
          "before:content-[''] before:absolute before:left-1/2 before:top-0",
          "before:w-[150%] before:h-full before:bg-gradient-to-r",
          "before:from-sky-500/20 before:via-sky-500/20 before:to-sky-500/20",
          "before:opacity-0 hover:before:animate-bubble-top",
          "after:content-[''] after:absolute after:left-1/2 after:bottom-0",
          "after:w-[150%] after:h-full after:bg-gradient-to-r",
          "after:from-sky-500/20 after:via-sky-500/20 after:to-sky-500/20",
          "after:opacity-0 hover:after:animate-bubble-bottom",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

BubbleButton.displayName = 'BubbleButton';

export default BubbleButton;
