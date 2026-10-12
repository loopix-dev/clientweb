import { cn } from "@/lib/utils";

/**
 * The Loopix mark: an open chamfered loop with a node seated in the gap.
 * Geometric, readable at 16px. Uses currentColor so the admin-set accent
 * color applies everywhere the mark appears.
 */
export function LoopixMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-7 w-7 text-accent", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M19.25 6.25 29 16 16 29 3 16 16 3 25.75 12.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22.5 7.3 24.7 9.5 22.5 11.7 20.3 9.5Z" fill="currentColor" />
    </svg>
  );
}

export function LoopixLogo({
  className,
  name = "Loopix",
  suffix = "Client",
}: {
  className?: string;
  name?: string;
  suffix?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LoopixMark className="h-[26px] w-[26px]" />
      <span className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-fg">{name}</span>
        {suffix ? <span className="text-[13px] font-medium tracking-tight text-fg-3">{suffix}</span> : null}
      </span>
    </span>
  );
}
