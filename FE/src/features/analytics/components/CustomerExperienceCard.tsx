
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Smile } from "lucide-react";

interface Props {
  score?: number | null;
}

function getMeta(score: number) {
  if (score >= 85)
    return { label: "Excellent", color: "text-emerald-600", Icon: TrendingUp };

  if (score >= 70)
    return { label: "Good", color: "text-blue-600", Icon: Smile };

  return { label: "Needs Improvement", color: "text-rose-600", Icon: TrendingDown };
}

export default function CustomerExperienceCard({ score }: Props) {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;

  const { label, color, Icon } = getMeta(safeScore);

  return (
    <div className="rounded-2xl border p-6">

      <div className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Customer Satisfaction
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="text-5xl font-bold mt-2">
        {safeScore}%
      </div>

      <div className="mt-3 text-xs font-medium">
        <span className={cn(color)}>{label}</span>
      </div>

      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${Math.min(safeScore, 100)}%` }}
        />
      </div>

    </div>
  );
}