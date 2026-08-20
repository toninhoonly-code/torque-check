import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { dataHora } from "@/lib/oficina";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de veículos — Mecânica Alto Torque" },
      {
        name: "description",
        content: "Histórico completo de veículos e atendimentos da Mecânica Alto Torque.",
      },
      { property: "og:title", content: "Histórico de veículos — Mecânica Alto Torque" },
      {
        property: "og:description",
        content: "Histórico completo de veículos e atendimentos da Mecânica Alto Torque.",
      },
    ],
  }),
  component: Historico,
});

type Veiculo = {
  id: string;
  placa: string;
  modelo: string | null;
  ano: string | null;
  clientes: { nome: string } | null;
  atendimentos: { id: string; numero: number; status: string; created_at: string; servicos_realizados: string | null }[];
};

function Historico() {
  const [busca, setBusca] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veiculos")
        .select(
          "id, placa, modelo, ano, clientes(nome), atendimentos(id, numero, status, created_at, servicos_realizados)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Veiculo[];
    },
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = data ?? [];
    if (!q) return lista;
    return lista.filter(
      (v) =>
        v.placa.toLowerCase().includes(q) || (v.clientes?.nome ?? "").toLowerCase().includes(q),
    );
  }, [data, busca]);

  return (
    <>
      <AppHeader titulo="Histórico de veículos" voltar="/inicio" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por placa ou nome do cliente"
          className="h-13 w-full rounded-xl border border-input bg-secondary px-4 py-3 text-base"
        />
        {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && filtrados.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum veículo encontrado.
          </p>
        )}
        <ul className="space-y-3">
          {filtrados.map((v) => (
            <li key={v.id} className="surface-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold tracking-wide">{v.placa}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[v.modelo, v.ano].filter(Boolean).join(" • ") || "Sem modelo informado"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{v.clientes?.nome}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {v.atendimentos.length} atend.
                </span>
              </div>
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {[...v.atendimentos]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/atendimento/$id"
                        params={{ id: a.id }}
                        className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-3"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            Nº {a.numero} — {a.servicos_realizados?.slice(0, 40) || a.status}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {dataHora(a.created_at)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-bold uppercase text-primary">
                          Abrir
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
