import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, History, PlusCircle, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
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

const botoes = [
  { to: "/nova", label: "Nova entrada", icon: PlusCircle, destaque: true },
  { to: "/historico", label: "Veículos / Histórico", icon: History },
  { to: "/andamento", label: "Atendimentos em andamento", icon: ClipboardList },
  { to: "/buscar", label: "Buscar pela placa", icon: Search },
] as const;

function Inicio() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
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
