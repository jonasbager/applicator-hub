import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import * as React from "react";

interface LoadingSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSkeleton({ className, children }: LoadingSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn(
        "relative overflow-hidden bg-gray-100 rounded-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
