import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/app/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { LegalLinks } from "@/components/legal/legal-links";
import { Page, SectionLabel } from "@/components/app/page-header";
import { SectionBoundary } from "@/components/app/section-error";
import { AvatarForm } from "@/components/forms/avatar-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { getMe, listCategories, listGroups } from "@/lib/api/kotta";
import { formatMemberSince } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Perfil — Kotta Groups",
};

// Só os dados da conta seguram a página; grupos e categorias falham sozinhos (issue #11).
export default async function PerfilPage() {
  const me = await getMe();
  const memberSince = formatMemberSince(me.createdAt);

  return (
    <Page title="Perfil" description="Seus dados e preferências na Kotta Groups.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12">
        <section
          aria-label="Resumo da conta"
          className="flex flex-col items-center gap-4 self-start rounded-card border border-kotta-border bg-kotta-surface p-8 text-center"
        >
          <AvatarForm emailConfirmed={me.emailConfirmed}>
            <Avatar person={me} size="xl" />
          </AvatarForm>
          <div className="min-w-0 max-w-full">
            <p className="text-2xl font-bold text-kotta-text">{me.name}</p>
            <p className="mt-1 truncate text-sm text-kotta-muted">{me.email}</p>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm text-kotta-muted">
            <li className="break-all">
              {me.pixKey ? (
                `Chave Pix: ${me.pixKey}`
              ) : (
                <a href="#pixKey" className="font-semibold text-kotta-primary underline underline-offset-2">
                  Nenhuma chave Pix cadastrada
                </a>
              )}
            </li>
            {memberSince ? <li>Membro desde {memberSince}</li> : null}
            <li>
              {me.emailConfirmed ? (
                "E-mail confirmado"
              ) : (
                <Link href="/confirme-seu-email" className="font-semibold text-kotta-danger underline underline-offset-2">
                  E-mail não confirmado
                </Link>
              )}
            </li>
          </ul>
          <SectionBoundary message="Não foi possível carregar seus grupos.">
            <Suspense fallback={null}>
              <GroupCount />
            </Suspense>
          </SectionBoundary>
          <div className="w-full">
            <LogoutButton label="Sair da conta" />
          </div>
          <LegalLinks className="justify-center" />
        </section>

        <div className="flex flex-col gap-8 lg:gap-12">
          <section aria-labelledby="dados">
            <SectionLabel id="dados">Seus dados</SectionLabel>
            <div className="flex flex-col gap-5 rounded-card border border-kotta-border bg-kotta-surface p-6">
              <div>
                <p className="text-sm font-semibold text-kotta-text">E-mail</p>
                <p className="mt-2 break-all text-base text-kotta-text">{me.email}</p>
              </div>
              <ProfileForm name={me.name} pixKey={me.pixKey ?? ""} />
            </div>
          </section>

          <section aria-labelledby="categorias">
            <SectionLabel id="categorias">Categorias</SectionLabel>
            <SectionBoundary message="Não foi possível carregar suas categorias.">
              <Suspense
                fallback={<div aria-busy="true" className="h-20 animate-pulse rounded-card border border-kotta-border bg-kotta-surface" />}
              >
                <CategoryList />
              </Suspense>
            </SectionBoundary>
            <Link href="/perfil/categorias" className="secondary-action mt-4">
              Gerenciar categorias
            </Link>
          </section>
        </div>
      </div>
    </Page>
  );
}

async function GroupCount() {
  const groups = await listGroups();
  return (
    <p className="text-[13px] font-semibold text-kotta-muted">
      {groups.length === 1 ? "1 grupo" : `${groups.length} grupos`}
    </p>
  );
}

async function CategoryList() {
  const categories = await listCategories();
  if (categories.length === 0) {
    return (
      <p className="rounded-card border border-kotta-border bg-kotta-surface p-6 text-sm text-kotta-muted">
        Você ainda não tem categorias.
      </p>
    );
  }
  return (
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
  );
}
