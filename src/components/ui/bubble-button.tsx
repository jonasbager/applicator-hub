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
          "relative px-6 py-2.5 bg-sky-500 text-white rounded-lg cursor-pointer",
          "transition-all duration-200 active:scale-96",
          // Before element (top bubbles)
          "before:absolute before:content-[''] before:w-[150%] before:h-full before:left-1/2",
          "before:top-[-70%] before:-translate-x-1/2 before:z-[-1000]",
          "before:bg-[radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,transparent_20%,theme(colors.sky.500)_20%,transparent_30%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,transparent_10%,theme(colors.sky.500)_15%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%)]",
          "before:bg-[size:10%_10%,20%_20%,15%_15%,20%_20%,18%_18%,10%_10%,15%_15%,10%_10%,18%_18%]",
          "before:bg-[position:50%_120%]",
          "hover:before:animate-greentopBubbles",
          // After element (bottom bubbles)
          "after:absolute after:content-[''] after:w-[150%] after:h-full after:left-1/2",
          "after:bottom-[-70%] after:-translate-x-1/2 after:z-[-1000]",
          "after:bg-[radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,transparent_10%,theme(colors.sky.500)_15%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%),radial-gradient(circle,theme(colors.sky.500)_20%,transparent_20%)]",
          "after:bg-[size:15%_15%,20%_20%,18%_18%,20%_20%,15%_15%,20%_20%,18%_18%]",
          "after:bg-[position:50%_0%]",
          "hover:after:animate-greenbottomBubbles",
          // Hover state
          "hover:bg-sky-600",
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
