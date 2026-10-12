import { avatarColors } from "@/lib/theme";
import type { Member } from "@/lib/demo-app";

const sizes = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-20 text-2xl",
} as const;

interface AvatarProps {
  member: Member;
  size?: keyof typeof sizes;
  className?: string;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ member, size = "md", className = "" }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizes[size]} ${className}`}
      style={{ backgroundColor: avatarColors[member.colorIndex % avatarColors.length] }}
      aria-hidden="true"
    >
      {initials(member.name)}
    </span>
  );
}

interface AvatarStackProps {
  members: Member[];
  max?: number;
}

export function AvatarStack({ members, max = 4 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const hidden = members.length - visible.length;
  return (
    <span className="flex -space-x-1.5">
      {visible.map((member) => (
        <Avatar
          key={member.id}
          member={member}
          size="sm"
          className="ring-2 ring-kotta-surface"
        />
      ))}
      {hidden > 0 ? (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-kotta-light-green font-mono text-[11px] text-kotta-primary ring-2 ring-kotta-surface">
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}
