import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { usePapel } from "@/hooks/usePapel";
import { supabase } from "@/integrations/supabase/client";
import {
  definirPapel,
  excluirRegistro,
  listarUsuarios,
  vincularCliente,
} from "@/lib/admin.functions";
import { dataHora } from "@/lib/oficina";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Mecânica Alto Torque" },
      {
        name: "description",
        content: "Área do administrador: usuários, clientes, veículos e exclusões definitivas.",
      },
      { property: "og:title", content: "Administração — Mecânica Alto Torque" },
      {
        property: "og:description",
        content: "Área do administrador: usuários, clientes, veículos e exclusões definitivas.",
      },
    ],
  }),
  component: Admin,
});

type ClienteRow = {
  id: string;
  nome: string;
  telefone: string | null;
  user_id: string | null;
  veiculos: { id: string; placa: string; modelo: string | null }[];
  atendimentos: { id: string; numero: number; status: string; created_at: string }[];
};

function Admin() {
  const { isAdmin, carregando } = usePapel();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");

  const fnUsuarios = useServerFn(listarUsuarios);
  const fnPapel = useServerFn(definirPapel);
  const fnVincular = useServerFn(vincularCliente);
  const fnExcluir = useServerFn(excluirRegistro);

  useEffect(() => {
    if (!carregando && !isAdmin) {
      toast.error("Área exclusiva do administrador");
      navigate({ to: "/inicio", replace: true });
    }
  }, [carregando, isAdmin, navigate]);

  const usuarios = useQuery({
    queryKey: ["admin-usuarios"],
    enabled: isAdmin,
    queryFn: () => fnUsuarios({ data: undefined }),
  });

  const clientes = useQuery({
    queryKey: ["admin-clientes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id, nome, telefone, user_id, veiculos(id, placa, modelo), atendimentos(id, numero, status, created_at)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ClienteRow[];
    },
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = clientes.data ?? [];
    if (!q) return lista;
    return lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone ?? "").includes(q) ||
        c.veiculos.some((v) => v.placa.toLowerCase().includes(q)),
    );
  }, [clientes.data, busca]);

  async function acao(fn: () => Promise<unknown>, sucesso: string) {
    try {
      await fn();
      toast.success(sucesso);
      await qc.invalidateQueries({ queryKey: ["admin-clientes"] });
      await qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      await qc.invalidateQueries({ queryKey: ["historico"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir");
    }
  }

  function confirmar(msg: string) {
    return window.confirm(`${msg}\n\nEsta ação é DEFINITIVA e não pode ser desfeita.`);
  }

  if (carregando || !isAdmin) {
    return (
      <>
        <AppHeader titulo="Administração" voltar="/inicio" />
        <main className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader titulo="Administração" voltar="/inicio" />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-primary">
            Contas de acesso
          </h2>
          {usuarios.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando contas...</p>
          )}
          {usuarios.error && (
            <p className="text-sm text-primary">
              {usuarios.error instanceof Error ? usuarios.error.message : "Erro ao carregar contas"}
            </p>
          )}
          <ul className="space-y-3">
            {(usuarios.data ?? []).map((u) => (
              <li key={u.id} className="surface-card space-y-3 p-4">
                <p className="break-all text-sm font-bold">{u.email || u.id}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "funcionario", "cliente"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        acao(
                          () => fnPapel({ data: { userId: u.id, papel: p } }),
                          "Papel atualizado",
                        )
                      }
                      className={`rounded-lg py-3 text-[11px] font-bold uppercase ${
                        u.papel === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-primary">
            Clientes, veículos e atendimentos
          </h2>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou placa"
            className="h-13 w-full rounded-xl border border-input bg-secondary px-4 py-3 text-base"
          />
          {clientes.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          <ul className="space-y-3">
            {filtrados.map((c) => (
              <li key={c.id} className="surface-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.telefone || "Sem telefone"} • {c.veiculos.length} veículo(s) •{" "}
                      {c.atendimentos.length} atendimento(s)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirmar(`Excluir o cliente ${c.nome} com todos os veículos, atendimentos e fotos?`))
                        void acao(
                          () => fnExcluir({ data: { tipo: "cliente", id: c.id } }),
                          "Cliente excluído",
                        );
                    }}
                    className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
                    aria-label={`Excluir cliente ${c.nome}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Conta de login vinculada
                  </span>
                  <select
                    value={c.user_id ?? ""}
                    onChange={(e) =>
                      acao(
                        () =>
                          fnVincular({
                            data: { clienteId: c.id, userId: e.target.value || null },
                          }),
                        "Vínculo atualizado",
                      )
                    }
                    className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                  >
                    <option value="">Nenhuma</option>
                    {(usuarios.data ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email || u.id}
                      </option>
                    ))}
                  </select>
                </label>

                {c.veiculos.length > 0 && (
                  <ul className="space-y-2">
                    {c.veiculos.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {v.placa} {v.modelo ? `• ${v.modelo}` : ""}
                        </span>
                        <button
                          onClick={() => {
                            if (confirmar(`Excluir o veículo ${v.placa} e seus atendimentos?`))
                              void acao(
                                () => fnExcluir({ data: { tipo: "veiculo", id: v.id } }),
                                "Veículo excluído",
                              );
                          }}
                          className="text-xs font-bold uppercase text-primary"
                        >
                          Excluir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {c.atendimentos.length > 0 && (
                  <ul className="space-y-2">
                    {c.atendimentos.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs">
                          #{a.numero} • {a.status} • {dataHora(a.created_at)}
                        </span>
                        <button
                          onClick={() => {
                            if (confirmar(`Excluir o atendimento #${a.numero} e suas fotos?`))
                              void acao(
                                () => fnExcluir({ data: { tipo: "atendimento", id: a.id } }),
                                "Atendimento excluído",
                              );
                          }}
                          className="text-xs font-bold uppercase text-primary"
                        >
                          Excluir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
