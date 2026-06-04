import { cn } from "@/lib/utils";

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const percent = Math.round(value * 100);
  const level = percent < 70 ? "Low Confidence" : percent < 90 ? "Medium Confidence" : "High Confidence";
  const color = percent < 70 ? "bg-sky-500" : percent < 90 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{level}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Confidence reflects how complete and consistent the extracted claim evidence is before deterministic policy rules run.
      </p>
      {percent < 70 ? <p className="text-xs font-medium text-sky-800">Manual review recommended.</p> : null}
    </div>
  );
}
