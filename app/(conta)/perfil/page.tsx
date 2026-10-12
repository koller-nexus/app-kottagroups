import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { Page, SectionLabel } from "@/components/app/page-header";
import { ProfileForm } from "@/components/forms/profile-form";
import { getMe, listCategories, listGroups } from "@/lib/api/kotta";

export const metadata: Metadata = {
  title: "Perfil — Kotta Groups",
};

export default async function PerfilPage() {
  const [me, groups, categories] = await Promise.all([getMe(), listGroups(), listCategories()]);

  return (
    <Page title="Perfil" description="Seus dados e preferências na Kotta Groups.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12">
        <section
          aria-label="Resumo da conta"
          className="flex flex-col items-center gap-4 self-start rounded-card border border-kotta-border bg-kotta-surface p-8 text-center"
        >
          <Avatar person={me} size="xl" />
          <div className="min-w-0 max-w-full">
            <p className="text-2xl font-bold text-kotta-text">{me.name}</p>
            <p className="mt-1 truncate text-sm text-kotta-muted">{me.email}</p>
          </div>
          <p className="text-[13px] font-semibold text-kotta-muted">
            {groups.length === 1 ? "1 grupo" : `${groups.length} grupos`}
          </p>
          <div className="w-full">
            <LogoutButton label="Sair da conta" />
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:gap-12">
          <section aria-labelledby="dados">
            <SectionLabel id="dados">Seus dados</SectionLabel>
            <div className="rounded-card border border-kotta-border bg-kotta-surface p-6">
              <ProfileForm name={me.name} pixKey={me.pixKey ?? ""} />
            </div>
          </section>

          <section aria-labelledby="categorias">
            <SectionLabel id="categorias">Categorias</SectionLabel>
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
            <Link href="/perfil/categorias" className="secondary-action mt-4">
              Gerenciar categorias
            </Link>
          </section>
        </div>
      </div>
    </Page>
  );
}
