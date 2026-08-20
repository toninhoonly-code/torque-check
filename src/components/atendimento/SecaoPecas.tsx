import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DESTINOS_PECA_ANTIGA } from "@/lib/oficina";

type Peca = {
  id: string;
  tipo: string;
  nome: string;
  marca: string | null;
  quantidade: number;
  observacao: string | null;
  destino_peca_antiga: string;
};

export function SecaoPecas({ atendimentoId }: { atendimentoId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["pecas", atendimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pecas")
        .select("id, tipo, nome, marca, quantidade, observacao, destino_peca_antiga")
        .eq("atendimento_id", atendimentoId)
        .order("created_at");
      if (error) throw error;
      return data as Peca[];
    },
  });

  const pecas = data ?? [];

  return (
    <div className="space-y-6">
      <Bloco
        titulo="Peças trocadas"
        tipo="trocada"
        atendimentoId={atendimentoId}
        pecas={pecas.filter((p) => p.tipo === "trocada")}
        comDestino
        onChange={() => qc.invalidateQueries({ queryKey: ["pecas", atendimentoId] })}
      />
      <Bloco
        titulo="Peças recomendadas"
        tipo="recomendada"
        atendimentoId={atendimentoId}
        pecas={pecas.filter((p) => p.tipo === "recomendada")}
        onChange={() => qc.invalidateQueries({ queryKey: ["pecas", atendimentoId] })}
      />
    </div>
  );
}

function Bloco({
  titulo,
  tipo,
  atendimentoId,
  pecas,
  comDestino,
  onChange,
}: {
  titulo: string;
  tipo: "trocada" | "recomendada";
  atendimentoId: string;
  pecas: Peca[];
  comDestino?: boolean;
  onChange: () => void;
}) {
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [destino, setDestino] = useState(DESTINOS_PECA_ANTIGA[3]!);

  async function adicionar() {
    if (!nome.trim()) {
      toast.error("Informe o nome da peça");
      return;
    }
    const { error } = await supabase.from("pecas").insert({
      atendimento_id: atendimentoId,
      tipo,
      nome: nome.trim(),
      marca: marca.trim() || null,
      quantidade: Number(quantidade) || 1,
      observacao: observacao.trim() || null,
      destino_peca_antiga: comDestino ? destino : "Não informado",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNome("");
    setMarca("");
    setQuantidade("1");
    setObservacao("");
    onChange();
    toast.success("Peça adicionada");
  }

  return (
    <section className="space-y-3">
      <h3 className="px-1 text-sm font-extrabold uppercase tracking-wide text-primary">{titulo}</h3>

      {pecas.map((p) => (
        <div key={p.id} className="surface-card grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {p.nome} <span className="text-muted-foreground">x{p.quantidade}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[p.marca, comDestino ? p.destino_peca_antiga : null].filter(Boolean).join(" • ")}
            </p>
            {p.observacao && <p className="mt-1 text-xs text-muted-foreground">{p.observacao}</p>}
          </div>
          <button
            aria-label="Excluir peça"
            onClick={async () => {
              await supabase.from("pecas").delete().eq("id", p.id);
              onChange();
            }}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="surface-card space-y-3 p-4">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da peça"
          maxLength={80}
          className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
        />
        <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-2">
          <input
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Marca"
            maxLength={60}
            className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
          />
          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            inputMode="numeric"
            placeholder="Qtd"
            className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-center text-base"
          />
        </div>
        {comDestino && (
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
          >
            {DESTINOS_PECA_ANTIGA.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação"
          maxLength={200}
          className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
        />
        <button
          onClick={adicionar}
          className="w-full rounded-lg bg-primary py-4 text-sm font-extrabold uppercase text-primary-foreground"
        >
          Adicionar peça
        </button>
      </div>
    </section>
  );
}
