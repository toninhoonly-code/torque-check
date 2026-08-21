import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FotoItem } from "@/components/FotoItem";
import { supabase } from "@/integrations/supabase/client";
import { removerArquivo, uploadFoto, urlsAssinadas } from "@/lib/fotos";

export type FotoRow = { id: string; etapa: string; item: string; storage_path: string };

export function useFotos(atendimentoId: string) {
  return useQuery({
    queryKey: ["fotos", atendimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fotos")
        .select("id, etapa, item, storage_path")
        .eq("atendimento_id", atendimentoId)
        .order("created_at");
      if (error) throw error;
      const urls = await urlsAssinadas(data.map((f) => f.storage_path));
      return { fotos: data as FotoRow[], urls };
    },
  });
}

export function SecaoFotos({
  atendimentoId,
  etapa,
  grupos,
  sugestoes,
  titulo,
}: {
  atendimentoId: string;
  etapa: "entrada" | "servico" | "saida";
  grupos?: { grupo: string; itens: string[] }[];
  sugestoes?: string[];
  titulo: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useFotos(atendimentoId);
  const [novoItem, setNovoItem] = useState("");
  const inputExtra = useRef<HTMLInputElement | null>(null);
  const inputGaleria = useRef<HTMLInputElement | null>(null);


  const fotosEtapa = useMemo(
    () => (data?.fotos ?? []).filter((f) => f.etapa === etapa),
    [data, etapa],
  );

  const itensFixos = grupos?.flatMap((g) => g.itens) ?? [];
  const feitas = itensFixos.filter((i) => fotosEtapa.some((f) => f.item === i)).length;
  const extras = fotosEtapa.filter((f) => !itensFixos.includes(f.item));

  async function salvar(item: string, file: File) {
    try {
      const path = await uploadFoto(atendimentoId, etapa, file);
      const antiga = fotosEtapa.find((f) => f.item === item && itensFixos.includes(item));
      if (antiga) {
        await supabase.from("fotos").update({ storage_path: path }).eq("id", antiga.id);
        await removerArquivo(antiga.storage_path);
      } else {
        await supabase.from("fotos").insert({ atendimento_id: atendimentoId, etapa, item, storage_path: path });
      }
      await qc.invalidateQueries({ queryKey: ["fotos", atendimentoId] });
      toast.success("Foto salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar foto");
    }
  }

  async function remover(f: FotoRow) {
    await supabase.from("fotos").delete().eq("id", f.id);
    await removerArquivo(f.storage_path);
    await qc.invalidateQueries({ queryKey: ["fotos", atendimentoId] });
  }

  if (isLoading) return <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-5">
      {grupos && (
        <div className="surface-card flex items-center justify-between p-4">
          <span className="text-sm font-bold uppercase tracking-wide">{titulo}</span>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            Fotos: {feitas} de {itensFixos.length}
          </span>
        </div>
      )}

      {grupos?.map((g) => (
        <section key={g.grupo} className="space-y-2">
          <h3 className="px-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            {g.grupo}
          </h3>
          {g.itens.map((item) => {
            const foto = fotosEtapa.find((f) => f.item === item);
            return (
              <FotoItem
                key={item}
                label={item}
                url={foto ? data?.urls[foto.storage_path] : undefined}
                onSelect={(file) => salvar(item, file)}
                onRemove={foto ? () => remover(foto) : undefined}
              />
            );
          })}
        </section>
      ))}

      <section className="space-y-2">
        <h3 className="px-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
          {grupos ? "Fotos extras" : titulo}
        </h3>
        {extras.map((f) => (
          <FotoItem
            key={f.id}
            label={f.item}
            url={data?.urls[f.storage_path]}
            onSelect={(file) => salvar(f.item, file)}
            onRemove={() => remover(f)}
          />
        ))}

        <div className="surface-card space-y-3 p-4">
          <input
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Descrição da foto (ex: peça antiga)"
            list={`sug-${etapa}`}
            maxLength={60}
            className="h-12 w-full rounded-lg border border-input bg-secondary px-4 text-base"
          />
          <datalist id={`sug-${etapa}`}>
            {(sugestoes ?? []).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (!novoItem.trim()) {
                  toast.error("Descreva a foto antes");
                  return;
                }
                inputExtra.current?.click();
              }}
              className="rounded-lg bg-primary py-4 text-sm font-extrabold uppercase text-primary-foreground"
            >
              Tirar foto
            </button>
            <button
              onClick={() => {
                if (!novoItem.trim()) {
                  toast.error("Descreva a foto antes");
                  return;
                }
                inputGaleria.current?.click();
              }}
              className="rounded-lg bg-secondary py-4 text-sm font-extrabold uppercase text-foreground"
            >
              Galeria
            </button>
          </div>
          <input
            ref={inputExtra}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              await salvar(novoItem.trim(), file);
              setNovoItem("");
            }}
          />
          <input
            ref={inputGaleria}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              await salvar(novoItem.trim(), file);
              setNovoItem("");
            }}
          />

        </div>
      </section>
    </div>
  );
}
