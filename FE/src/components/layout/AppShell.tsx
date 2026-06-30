import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AppShell({
  children,
  title,
  subtitle,
  actions,
}: AppShellProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Layer (decorative, non-interactive) */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/40" />
        <div className="absolute left-[-10%] top-[-10%] h-105 w-105 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-105 w-105 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — desktop only (lg+) */}
        <Sidebar />

        {/* Main layout */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header
            role="banner"
            className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl"
          >
            <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                {title && (
                  <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                    {subtitle}
                  </p>
                )}
              </div>

              {actions && (
                <div className="ml-4 flex items-center gap-2">{actions}</div>
              )}
            </div>
          </header>

          {/* Content — pad bottom on mobile so content isn't hidden behind BottomNav */}
          <main
            role="main"
            className="flex-1 overflow-y-auto pb-16 lg:pb-0"
          >
            <div className="mx-auto w-full max-w-7xl p-3 sm:p-4 lg:p-8">
              <div className="rounded-2xl border border-border/50 bg-background/60 shadow-xl shadow-black/5 backdrop-blur-xl dark:bg-card/50 lg:rounded-3xl">
                <div className="p-3 sm:p-4 lg:p-8">{children}</div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav />
    </div>
  );
}
