import type { Metadata } from "next";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/app/avatar";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { ProfileForm } from "@/components/forms/profile-form";
import { getMe, listCategories, listGroups } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Perfil — Kotta Groups",
};

export default async function PerfilPage() {
  const [me, groups, categories] = await Promise.all([getMe(), listGroups(), listCategories()]);

  return (
    <>
      <PageHeader title="Perfil" description="Seus dados e preferências na Kotta Groups." />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section
          aria-label="Resumo da conta"
          className="flex flex-col items-center gap-4 self-start rounded-card border border-kotta-border bg-kotta-surface p-8 text-center"
        >
          <Avatar person={me} size="xl" />
          <div className="min-w-0 max-w-full">
            <p className="font-display text-2xl font-bold text-kotta-secondary">{me.name}</p>
            <p className="mt-1 truncate font-mono text-xs text-kotta-muted">{me.email}</p>
          </div>
          <p className="font-mono text-xs text-kotta-muted">
            {groups.length === 1 ? "1 grupo" : `${groups.length} grupos`}
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="dados">
            <SectionLabel id="dados">SEUS DADOS</SectionLabel>
            <div className="rounded-card border border-kotta-border bg-kotta-surface p-6">
              <ProfileForm name={me.name} pixKey={me.pixKey ?? ""} />
            </div>
          </section>

          <section aria-labelledby="categorias">
            <SectionLabel id="categorias">CATEGORIAS</SectionLabel>
            <ul className="flex flex-wrap gap-2 rounded-card border border-kotta-border bg-kotta-surface p-6">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="inline-flex items-center gap-2 rounded-pill border border-kotta-border bg-kotta-bg px-3.5 py-2 text-sm text-kotta-text"
                >
                  <span aria-hidden="true">{category.emoji}</span>
                  {category.label}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="conta">
            <SectionLabel id="conta">CONTA</SectionLabel>
            <div className="rounded-card border border-kotta-border bg-kotta-surface p-6">
              <p className="text-sm text-kotta-muted">
                Ao sair, você precisa entrar de novo para ver seus grupos.
              </p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="mt-4 inline-flex min-h-11 items-center rounded-control border border-kotta-danger/40 px-5 font-semibold text-kotta-danger hover:bg-kotta-danger-bg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-danger"
                >
                  Sair da conta
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
