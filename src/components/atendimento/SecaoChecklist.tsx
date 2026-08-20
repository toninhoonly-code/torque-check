import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHECKLIST_ITENS, CHECKLIST_STATUS } from "@/lib/oficina";

type Linha = { id: string; item: string; status: string; observacao: string | null };

export function SecaoChecklist({
  atendimentoId,
  etapa,
}: {
  atendimentoId: string;
  etapa: "entrada" | "saida";
}) {
  const qc = useQueryClient();
  const chave = ["checklists", atendimentoId, etapa];

  const { data } = useQuery({
    queryKey: chave,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("id, item, status, observacao")
        .eq("atendimento_id", atendimentoId)
        .eq("etapa", etapa);
      if (error) throw error;
      return data as Linha[];
    },
  });

  async function salvar(item: string, patch: { status?: string; observacao?: string }) {
    const atual = (data ?? []).find((l) => l.item === item);
    await supabase.from("checklists").upsert(
      {
        atendimento_id: atendimentoId,
        etapa,
        item,
        status: patch.status ?? atual?.status ?? "Não verificado",
        observacao: patch.observacao ?? atual?.observacao ?? null,
      },
      { onConflict: "atendimento_id,etapa,item" },
    );
    await qc.invalidateQueries({ queryKey: chave });
  }

  return (
    <div className="space-y-3">
      {CHECKLIST_ITENS.map((item) => {
        const linha = (data ?? []).find((l) => l.item === item);
        const status = linha?.status ?? "Não verificado";
        return (
          <div key={item} className="surface-card space-y-3 p-4">
            <p className="text-sm font-bold">{item}</p>
            <div className="grid grid-cols-3 gap-2">
              {CHECKLIST_STATUS.map((s) => (
                <button
                  key={s}
                  onClick={() => salvar(item, { status: s })}
                  className={`rounded-lg py-3 text-[11px] font-bold uppercase ${
                    status === s
                      ? s === "OK"
                        ? "bg-[color:var(--color-success)] text-[color:var(--color-success-foreground)]"
                        : s === "Com avaria"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground text-background"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              defaultValue={linha?.observacao ?? ""}
              placeholder="Observação"
              maxLength={200}
              onBlur={(e) => {
                if (e.target.value !== (linha?.observacao ?? ""))
                  salvar(item, { observacao: e.target.value });
              }}
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
