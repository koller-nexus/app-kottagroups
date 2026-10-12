import type { ReactNode } from "react";

/** O "canteiro" do herói: campo verde com a curva no canto inferior direito. */
export function GardenField({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`flex flex-col gap-1 rounded-card rounded-br-[96px] bg-kotta-primary px-6 pt-6 pb-9 text-white ${className}`}
    >
      {children}
    </section>
  );
}
