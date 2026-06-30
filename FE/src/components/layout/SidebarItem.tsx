
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Optional badge or indicator (future-proofing) */
  badge?: string;
  className?: string;
}

export default function SidebarItem({
  to,
  icon: Icon,
  label,
  badge,
  className,
}: SidebarItemProps): React.ReactElement {
  return (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )
      }
    >
      {/* Icon */}
      <Icon
        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105"
        aria-hidden="true"
      />

      {/* Label */}
      <span className="truncate">{label}</span>

      {/* Optional badge */}
      {badge && (
        <span
          className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary"
          aria-label={`${label} badge`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}