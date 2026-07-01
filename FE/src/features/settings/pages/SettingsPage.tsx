
import ThemeToggle from "@/components/ThemeToggle";
import SLASettings from "../components/SLASettings";
import TicketWindowSettings from "../components/TicketWindowSettings";
import { useAuth } from "@/app/providers/AuthProvider";
import { UserPlus } from "lucide-react";
import CreateUserForm from "@/features/users/components/CreateUserForm";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage application preferences and system configuration
        </p>
      </header>

      {/* Theme Section */}
      <section className="rounded-2xl border p-5 space-y-3">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Choose how the application looks
        </p>
        <ThemeToggle />
      </section>

      {/* SLA Policy — admin only */}
      {isAdmin && (
        <section className="rounded-2xl border p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">SLA Policy</h2>
            <p className="text-sm text-muted-foreground">
              Multi-level SLA configuration — time limits for Level 1 (by priority) and
              escalation budgets for Levels 2–5. Changes apply org-wide immediately.
            </p>
          </div>
          <SLASettings />
        </section>
      )}

      {/* New Ticket Window — admin only */}
      {isAdmin && (
        <section className="rounded-2xl border p-5 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">New Ticket Window</h2>
            <p className="text-sm text-muted-foreground">
              Controls how long a ticket is automatically marked as <strong>new</strong> after creation.
            </p>
          </div>
          <TicketWindowSettings />
        </section>
      )}

      {/* Agent Settings — admin only: create new agent/manager/admin accounts */}
      {isAdmin && (
        <section className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Agent Settings</h2>
              <p className="text-sm text-muted-foreground">
                Create new agent, manager, or admin accounts. Public self-registration is
                disabled — this is the only way to add users to the CRM.
              </p>
            </div>
          </div>
          <CreateUserForm />
        </section>
      )}

      {/* Other placeholder modules */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h3 className="font-medium">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Coming soon — connect external systems
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <h3 className="font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Coming soon — email &amp; alert preferences
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <h3 className="font-medium">Billing</h3>
          <p className="text-sm text-muted-foreground">
            Coming soon — subscription &amp; invoices
          </p>
        </div>
      </section>
    </div>
  );
}
