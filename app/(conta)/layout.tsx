import { AppShell } from "@/components/app/app-shell";

export default function ContaLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
