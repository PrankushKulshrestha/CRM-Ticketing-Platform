import { useState, useEffect } from "react";
import { Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSystemSettings, useUpdateSystemSettings } from "../api/systemSettingsApi";

export default function TicketWindowSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateMut = useUpdateSystemSettings();

  const [hours, setHours] = useState<number>(24);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings?.new_ticket_window_hours != null) {
      setHours(settings.new_ticket_window_hours);
      setDirty(false);
    }
  }, [settings?.new_ticket_window_hours]);

  const handleChange = (v: string) => {
    const n = Number(v);
    if (!isNaN(n)) { setHours(n); setDirty(true); }
  };

  const handleSave = () => {
    updateMut.mutate(
      { new_ticket_window_hours: hours },
      { onSuccess: () => setDirty(false) }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm">
          Tickets created within the last{" "}
          <strong>
            <Input
              type="number"
              min={1}
              max={8760}
              value={hours}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isLoading}
              className="inline-block w-20 h-7 text-sm px-2 mx-1"
            />
          </strong>
          hours automatically receive status <code className="bg-muted px-1 rounded text-xs">new</code>.
          Older tickets default to <code className="bg-muted px-1 rounded text-xs">open</code>.
        </p>
      </div>

      {updateMut.isError && (
        <p className="text-xs text-destructive">Failed to save — please try again.</p>
      )}

      <Button
        size="sm"
        onClick={handleSave}
        disabled={!dirty || hours < 1 || updateMut.isPending}
      >
        <Save className="h-3.5 w-3.5 mr-1.5" />
        {updateMut.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
