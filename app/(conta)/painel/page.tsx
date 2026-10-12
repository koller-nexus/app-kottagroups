import { redirect } from "next/navigation";

// O painel agora vive em "/". Mantém links antigos funcionando.
export default function PainelPage() {
  redirect("/");
}
