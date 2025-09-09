
"use client";

import { cn } from "@/lib/utils";

const BouncingDots = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center gap-1.5", className)}>
    <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce"></div>
  </div>
);

export const Loader = ({
  className,
  variant = "dots",
}: {
  className?: string;
  variant?: "dots" | "spinner";
}) => {
  if (variant === "dots") {
    return <BouncingDots className={className} />;
  }

  // Fallback to a simple spinner if needed, though we'll default to dots
  return (
    <div
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        className
      )}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};
