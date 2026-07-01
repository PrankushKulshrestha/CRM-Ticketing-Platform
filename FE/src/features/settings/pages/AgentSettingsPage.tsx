// src/features/settings/pages/AgentSettingsPage.tsx
//
// Admin-only. Reachable only via RequireAdmin route guard (routing layer)
// and hidden from non-admins in Sidebar.tsx (nav layer). The real security
// boundary is server-side: POST /users requires USERS_CREATE (admin-only
// permission), and PUT /system-settings requires SETTINGS_MANAGE
// (admin-only permission) — see BE/src/middlewares/rbac.middleware.ts.

import { Users, SlidersHorizontal } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import CreateUserForm from "@/features/users/components/CreateUserForm";
import TicketWindowSettings from "../components/TicketWindowSettings";

export default function AgentSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold">Agent Settings</h1>
        <p className="text-muted-foreground">
          Admin-only controls for managing agent accounts and org-wide agent configuration
        </p>
      </header>

      <Tabs defaultValue="create-user">
        <TabsList>
          <TabsTrigger value="create-user">
            <Users className="mr-1.5 h-4 w-4" />
            Create User
          </TabsTrigger>
          <TabsTrigger value="basic-settings">
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            Basic Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create-user">
          <section className="rounded-2xl border p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Create User</h2>
              <p className="text-sm text-muted-foreground">
                Add a new agent, manager, or admin account. The user can sign in immediately
                with the temporary password below — encourage them to change it after first login.
              </p>
            </div>
            <CreateUserForm />
          </section>
        </TabsContent>

        <TabsContent value="basic-settings">
          {/* Scalable container for org-wide agent configuration. Add further
              <section> cards here as new settings are introduced. */}
          <div className="space-y-6">
            <section className="rounded-2xl border p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">New Ticket Window</h2>
                <p className="text-sm text-muted-foreground">
                  Controls how long a ticket is automatically marked as <strong>new</strong> after
                  creation, for every agent.
                </p>
              </div>
              <TicketWindowSettings />
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
