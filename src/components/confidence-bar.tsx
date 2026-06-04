import { cn } from "@/lib/utils";

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const percent = Math.round(value * 100);
  const level = percent < 70 ? "Low Confidence" : percent < 90 ? "Medium Confidence" : "High Confidence";
  const color = percent < 70 ? "bg-sky-500" : percent < 90 ? "bg-amber-500" : "bg-emerald-500";
  const badgeColor = percent < 70 ? "border-sky-200 bg-sky-50 text-sky-800" : percent < 90 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const tooltip = "Confidence reflects document clarity, extraction completeness, and consistency before deterministic policy rules run.";
  return (
    <div className={cn("space-y-2", className)} title={tooltip}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={cn("inline-flex items-center rounded-md border px-2 py-1 font-semibold leading-none", badgeColor)}>
          {level}
        </span>
        <span className="font-medium text-muted-foreground" aria-label={`Confidence score ${percent} percent`}>
          {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={level}>
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {tooltip}
      </p>
      {percent < 70 ? <p className="text-xs font-medium text-sky-800">Manual review recommended.</p> : null}
    </div>
  );
}
