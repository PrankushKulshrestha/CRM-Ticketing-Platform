
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  compliance?: number;
  breached?: number;
}

const toNumber = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

function getStatus(c: number) {
  if (c >= 90) return { label: "Healthy", Icon: ShieldCheck, color: "text-emerald-600" };
  if (c >= 80) return { label: "Stable", Icon: ShieldCheck, color: "text-blue-600" };
  return { label: "At Risk", Icon: AlertTriangle, color: "text-red-600" };
}

export default function SLAHealthCard({ compliance, breached }: Props) {
  const safeCompliance = toNumber(compliance);
  const safeBreached = toNumber(breached);

  const status = getStatus(safeCompliance);
  const Icon = status.Icon;

  return (
    <div className="rounded-2xl border p-6">

      <div className="flex justify-between">
        <div className="text-sm font-semibold">SLA Health</div>

        <div className={`flex items-center gap-2 text-xs ${status.color}`}>
          <Icon size={14} />
          {status.label}
        </div>
      </div>

      <div className="text-4xl font-bold mt-4">
        {safeCompliance}%
      </div>

      <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${Math.min(safeCompliance, 100)}%` }}
        />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Breached: {safeBreached}
      </div>

    </div>
  );
}