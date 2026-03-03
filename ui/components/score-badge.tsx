import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 8) return "bg-green-900/50 text-green-400 border-green-800";
  if (score >= 6) return "bg-blue-900/50 text-blue-400 border-blue-800";
  if (score >= 4) return "bg-yellow-900/50 text-yellow-400 border-yellow-800";
  return "bg-zinc-800 text-zinc-400 border-zinc-700";
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums",
        scoreColor(score)
      )}
    >
      {score}
    </span>
  );
}
