import { AvatarPhoto } from "@/components/app/avatar-photo";
import { avatarColors } from "@/lib/theme";
import { colorIndexFor } from "@/lib/kotta-view";

export interface AvatarPerson {
  id: string;
  name: string;
  /** Link assinado e temporário; vem sempre da resposta mais recente da API. */
  avatarUrl?: string | null;
}

const sizes = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-20 text-2xl",
} as const;

interface AvatarProps {
  person: AvatarPerson;
  size?: keyof typeof sizes;
  className?: string;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ person, size = "md", className = "" }: AvatarProps) {
  const color = avatarColors[colorIndexFor(person.id, avatarColors.length)];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {person.avatarUrl ? (
        <AvatarPhoto key={person.avatarUrl} src={person.avatarUrl} fallback={initials(person.name)} />
      ) : (
        initials(person.name)
      )}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: AvatarPerson[]; max?: number }) {
  const visible = people.slice(0, max);
  const hidden = people.length - visible.length;
  return (
    <span className="flex -space-x-1.5">
      {visible.map((person) => (
        <Avatar key={person.id} person={person} size="sm" className="ring-2 ring-kotta-surface" />
      ))}
      {hidden > 0 ? (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-kotta-light-green text-[11px] font-semibold text-kotta-primary ring-2 ring-kotta-surface">
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}
