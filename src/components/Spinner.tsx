"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

type LoadingButtonProps = {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
};

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  type = "button",
  onClick,
  size = "md",
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        className
      )}
    >
      {isLoading && <Spinner size={size} />}
      {isLoading ? (loadingText || children) : children}
    </button>
  );
}
