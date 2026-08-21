import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, History, PlusCircle, Search, Shield } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { usePapel } from "@/hooks/usePapel";
import { OFICINA } from "@/lib/oficina";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Mecânica Alto Torque" },
      { name: "description", content: "Menu principal do check-in de veículos da oficina." },
      { property: "og:title", content: "Início — Mecânica Alto Torque" },
      { property: "og:description", content: "Menu principal do check-in de veículos da oficina." },
    ],
  }),
  component: Inicio,
});

type Botao = {
  to: string;
  label: string;
  icon: typeof PlusCircle;
  destaque?: boolean;
};

const EQUIPE: Botao[] = [
  { to: "/nova", label: "Nova entrada", icon: PlusCircle, destaque: true },
  { to: "/historico", label: "Veículos / Histórico", icon: History },
  { to: "/andamento", label: "Atendimentos em andamento", icon: ClipboardList },
  { to: "/buscar", label: "Buscar pela placa", icon: Search },
];

const CLIENTE: Botao[] = [
  { to: "/historico", label: "Meus veículos e histórico", icon: History, destaque: true },
];

function Inicio() {
  const { isEquipe, isAdmin, carregando } = usePapel();

  const botoes: Botao[] = carregando
    ? []
    : isEquipe
      ? [...EQUIPE, ...(isAdmin ? [{ to: "/admin", label: "Administração", icon: Shield }] : [])]
      : CLIENTE;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {carregando && (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
        )}
        {botoes.map((b) => (
          <Link
            key={b.to}
            to={b.to}
            className={`flex items-center gap-4 rounded-2xl border p-5 ${
              b.destaque
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            }`}
          >
            <b.icon className="size-8 shrink-0" />
            <span className="text-lg font-extrabold uppercase tracking-wide">{b.label}</span>
          </Link>
        ))}
        <p className="pt-6 text-center text-xs text-muted-foreground">
          {OFICINA.nome} • {OFICINA.cidade} • {OFICINA.whatsapp}
        </p>
      </main>
    </>
  );
}

