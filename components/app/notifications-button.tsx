import { BellIcon } from "@/components/app/icons";

export function NotificationsButton() {
  // TODO: abrir notificações vindas da api-kottagroups.
  return (
    <button
      type="button"
      aria-label="Notificações, 2 novas"
      className="relative flex size-11 items-center justify-center rounded-full text-kotta-text hover:bg-kotta-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
    >
      <BellIcon className="size-6" />
      <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-kotta-danger ring-2 ring-kotta-surface" />
    </button>
  );
}
