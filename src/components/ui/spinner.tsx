import { cn } from "../../lib/utils";
import { RefreshCw } from "lucide-react";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <RefreshCw className={cn("animate-spin", className)} />
  );
}
