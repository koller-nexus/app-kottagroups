import { PublicFrame } from "@/components/app/public-frame";

export default function AcessoLayout({ children }: LayoutProps<"/">) {
  return <PublicFrame>{children}</PublicFrame>;
}
