
import { Bell, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import MobileSidebar from "./MobileSidebar";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLogout } from "@/features/auth/hooks/useLogout";

function getInitial(name?: string): string {
  if (!name) return "U";
  return name.trim().charAt(0).toUpperCase();
}

export default function Header(): React.ReactElement {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const isLoggingOut = logoutMutation.isPending;

  return (
    <header
      role="banner"
      className="flex h-16 items-center justify-between border-b bg-background px-6"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <MobileSidebar />

        <div className="leading-tight">
          <h2 className="text-lg font-semibold">Welcome back</h2>
          <p className="text-xs text-muted-foreground">
            CRM Ticketing Platform
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar aria-label="User avatar">
            <AvatarFallback>
              {getInitial(user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden text-sm md:block">
            <p className="font-medium leading-none">
              {user?.name ?? "Unknown User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role ?? "member"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          aria-label="Logout"
        >
          <LogOut className="mr-2 h-4 w-4" />

          {isLoggingOut ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </header>
  );
}