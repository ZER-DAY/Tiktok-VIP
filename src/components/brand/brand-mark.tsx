import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Kept for call-site compatibility; the mark is artwork, not an icon font. */
  iconClassName?: string;
}

/**
 * The LS monogram, on the brand's own near-black plate.
 *
 * The logo is gold and brushed silver drawn for a black field: on white the
 * silver half of the monogram all but disappears, so the plate is not
 * decoration - it is what keeps the mark legible on the light surfaces this
 * sits on (auth screens, the sidebar, the footer). Same reason the favicon is
 * baked onto black.
 */
export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-[#0b0b0d] shadow-[0_8px_24px_-12px_rgba(0,0,0,.55)]",
        className
      )}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={176}
        height={176}
        priority
        className={cn("size-[82%] object-contain", iconClassName)}
      />
    </span>
  );
}

interface BrandLogoProps {
  className?: string;
  /** Rendered eagerly in headers; pass false for below-the-fold placements. */
  priority?: boolean;
}

/**
 * The full lockup - monogram plus "LIVE STREAM TECHNOLOGY". Only place this on
 * a dark surface, for the reason described above.
 */
export function BrandLogo({ className, priority = true }: BrandLogoProps) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt="LIVE STREAM TECHNOLOGY"
      width={600}
      height={167}
      priority={priority}
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
