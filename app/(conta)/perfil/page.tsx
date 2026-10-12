import type { Metadata } from "next";
import { Avatar } from "@/components/app/avatar";
import { PageHeader, SectionLabel } from "@/components/app/page-header";
import { CURRENT_USER_ID, categories, getMember, groups } from "@/lib/demo-app";

export const metadata: Metadata = {
  title: "Perfil — Kotta Groups",
};

export default function PerfilPage() {
  const me = getMember(CURRENT_USER_ID);

  return (
    <>
      <PageHeader title="Perfil" description="Seus dados e preferências na Kotta Groups." />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section
          aria-label="Seus dados"
          className="flex flex-col items-center gap-4 self-start rounded-card border border-kotta-border bg-kotta-surface p-8 text-center"
        >
          <Avatar member={me} size="xl" />
          <div>
            <p className="font-display text-2xl font-bold text-kotta-secondary">{me.name}</p>
            <p className="mt-1 font-mono text-xs text-kotta-muted">{me.email}</p>
          </div>
          <p className="font-mono text-xs text-kotta-muted">
            {groups.length} grupos
          </p>
          {/* TODO: abrir edição de perfil. */}
          <button type="button" className="secondary-action w-full">
            Editar perfil
          </button>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="pix">
            <SectionLabel id="pix">CHAVE PIX</SectionLabel>
            <div className="flex flex-col gap-4 rounded-card border border-kotta-border bg-kotta-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-mono text-[15px] text-kotta-text">
                  {me.pixKey ?? "Nenhuma chave cadastrada"}
                </p>
                <p className="mt-1 text-sm text-kotta-muted">
                  Os membros dos seus grupos usam esta chave para te pagar.
                </p>
              </div>
              {/* TODO: copiar/alterar chave Pix. */}
              <button type="button" className="secondary-action shrink-0">
                Alterar chave
              </button>
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
              {/* TODO: encerrar sessão na api-kottagroups. */}
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 items-center rounded-control border border-kotta-danger/40 px-5 font-semibold text-kotta-danger hover:bg-kotta-danger-bg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kotta-danger"
              >
                Sair da conta
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
