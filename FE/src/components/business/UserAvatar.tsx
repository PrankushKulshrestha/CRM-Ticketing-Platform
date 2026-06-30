
/**
 * UserAvatar (Enterprise Grade)
 *
 * Agent / staff avatar with:
 * - Image fallback to deterministic initials
 * - Role-based ring styling
 * - Presence indicator
 * - Optional tooltip
 * - Accessible markup
 */

import { useMemo, useState } from "react";
import { cn, hashString, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "supervisor" | "agent" | "viewer" | string;
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type PresenceStatus = "online" | "away" | "offline";

export interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  role?: UserRole;
  size?: AvatarSize;
  status?: PresenceStatus;
  tooltip?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const STATUS_DOT_SIZE: Record<AvatarSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

const PRESENCE_COLOR: Record<PresenceStatus, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  offline: "bg-slate-400",
};

const ROLE_RING: Record<UserRole, string> = {
  admin: "ring-2 ring-red-400",
  supervisor: "ring-2 ring-amber-400",
  agent: "ring-2 ring-primary/40",
  viewer: "",
};

// fallback-safe palette
const BG_PALETTE = [
  "bg-indigo-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-pink-500",
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function normalizeRole(role?: UserRole): UserRole {
  return role ?? "viewer";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserAvatar({
  name,
  imageUrl,
  role,
  size = "md",
  status,
  tooltip = true,
  className,
}: UserAvatarProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);

  const safeRole = normalizeRole(role);
  const showImage = Boolean(imageUrl && !imgError);

  const initials = useMemo(() => getInitials(name), [name]);

  const bgColor = useMemo(
    () => BG_PALETTE[hashString(name) % BG_PALETTE.length],
    [name],
  );

  const roleRing = ROLE_RING[safeRole];

  const label = useMemo(() => {
    if (!tooltip) return undefined;
    return role ? `${name} (${role})` : name;
  }, [tooltip, name, role]);

  return (
    <span
      role="img"
      aria-label={`Avatar for ${name}${role ? `, role ${role}` : ""}`}
      title={label}
      className={cn("relative inline-flex shrink-0", className)}
    >
      {/* Avatar body */}
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-semibold select-none overflow-hidden",
          SIZE_CLASSES[size],
          roleRing,
          showImage ? "bg-transparent" : `${bgColor} text-white`,
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </span>

      {/* Presence indicator */}
      {status && (
        <span
          aria-label={status}
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            STATUS_DOT_SIZE[size],
            PRESENCE_COLOR[status],
          )}
        />
      )}
    </span>
  );
}