
interface OpenTicketsWidgetProps {
  count: number;
  label?: string;
  description?: string;
}

export function OpenTicketsWidget({
  count,
  label = "Open Tickets",
  description = "Tickets currently awaiting action",
}: OpenTicketsWidgetProps) {
  return (
    <div className="dashboard-card h-full p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          {label}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <p className="text-4xl font-bold tracking-tight">
        {count}
      </p>
    </div>
  );
}

export default OpenTicketsWidget;