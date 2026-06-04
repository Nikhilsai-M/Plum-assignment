import * as React from "react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-800",
  MANUAL_REVIEW: "border-sky-200 bg-sky-50 text-sky-800"
};

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold",
        variant ? styles[variant] ?? "border bg-muted text-foreground" : "border bg-muted text-foreground",
        className
      )}
      {...props}
    />
  );
}
