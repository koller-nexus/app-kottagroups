import type { StoreKind } from "@/lib/demo-landing";

interface StoreBadgeProps {
  store: StoreKind;
}

export function StoreBadge({ store }: StoreBadgeProps) {
  const isApple = store === "app-store";
  const lineOne = isApple ? "Baixar na" : "Disponível no";
  const lineTwo = isApple ? "App Store" : "Google Play";
  const accessibleName = `${lineOne} ${lineTwo}, em breve`;

  return (
    <button
      type="button"
      aria-label={accessibleName}
      className="flex h-14 w-full min-w-0 items-center gap-2 rounded-[8px] bg-black px-2.5 text-left text-white outline-none ring-kotta-primary focus-visible:ring-2"
    >
      <span className="flex size-7 shrink-0 items-center justify-center">
        {isApple ? <AppleMark /> : <PlayMark />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="block h-3.5 overflow-visible whitespace-nowrap text-[10px] leading-[14px] text-white">
          {lineOne}
        </span>
        <span className="block h-5 overflow-visible whitespace-nowrap text-[14px] font-semibold leading-5 tracking-tight text-white">
          {lineTwo}
        </span>
      </span>
    </button>
  );
}

function AppleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 20"
      className="h-6 w-4 fill-white"
    >
      <path d="M13.2 10.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.7-3.2zM11.1 4.3c.7-.8 1.1-1.9 1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 2.9 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 22"
      className="h-6 w-4"
    >
      <path fill="#34A853" d="M1 1.2v19.6l11-9.8L1 1.2z" />
      <path fill="#FBBC04" d="M14.2 8.4 1 1.2l8.6 8.6 4.6-1.4z" />
      <path fill="#EA4335" d="M1 20.8 14.2 13.6 9.6 11.8 1 20.8z" />
      <path fill="#4285F4" d="M19.2 11 14.2 8.4 9.6 11.8l4.6 3.4L19.2 11z" />
    </svg>
  );
}
