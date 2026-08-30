import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Small, reusable identity mark used by marketing, auth and app-shell screens.
 * Keeping the mark in one place makes the visual language consistent across
 * every surface without coupling it to a specific route.
 */
export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[0.9rem] bg-brand text-brand-foreground shadow-[0_8px_24px_-12px_rgba(255,77,103,.7)]",
        className
      )}
    >
      <BarChart3 className={cn("size-5", iconClassName)} strokeWidth={2.4} />
    </span>
  );
}
