
import { useMemo, useState } from "react";
import { cn, getInitials, hashString } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type OnlineStatus = "online" | "away" | "offline";

export interface CustomerAvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  status?: OnlineStatus;
  className?: string;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const STATUS_SIZE: Record<AvatarSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

const STATUS_COLOR: Record<OnlineStatus, string> = {
  online: "bg-emerald-500",
  away:   "bg-amber-400",
  offline: "bg-slate-400",
};

const BG_PALETTE = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-cyan-500",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerAvatar({
  name,
  imageUrl,
  size = "md",
  status,
  className,
}: CustomerAvatarProps): React.ReactElement {
  const [imgFailed, setImgFailed] = useState(false);

  const hasImage = Boolean(imageUrl && !imgFailed);

  // Both helpers now imported from @/lib/utils
  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor  = useMemo(
    () => BG_PALETTE[hashString(name) % BG_PALETTE.length],
    [name],
  );

  const label = useMemo(
    () => `Avatar of ${name}${status ? ` (${status})` : ""}`,
    [name, status],
  );

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      aria-label={label}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-semibold select-none overflow-hidden",
          SIZE_CLASSES[size],
          hasImage ? "bg-transparent" : `${bgColor} text-white`,
        )}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </span>

      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            STATUS_SIZE[size],
            STATUS_COLOR[status],
          )}
        />
      )}
    </span>
  );
}