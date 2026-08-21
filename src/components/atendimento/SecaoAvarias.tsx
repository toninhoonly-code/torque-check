import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Images, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CarDiagram } from "@/components/CarDiagram";
import { supabase } from "@/integrations/supabase/client";
import { removerArquivo, uploadFoto, urlsAssinadas } from "@/lib/fotos";
import { TIPOS_AVARIA } from "@/lib/oficina";

type Avaria = {
  id: string;
  tipo: string;
  descricao: string | null;
  pos_x: number | null;
  pos_y: number | null;
  storage_path: string | null;
};

export function SecaoAvarias({ atendimentoId }: { atendimentoId: string }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState(TIPOS_AVARIA[0]!);
  const [descricao, setDescricao] = useState("");
  const [ponto, setPonto] = useState<{ x: number; y: number } | null>(null);
  const fotoRef = useRef<HTMLInputElement | null>(null);
  const galeriaRef = useRef<HTMLInputElement | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["avarias", atendimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avarias")
        .select("id, tipo, descricao, pos_x, pos_y, storage_path")
        .eq("atendimento_id", atendimentoId)
        .order("created_at");
      if (error) throw error;
      const urls = await urlsAssinadas(
        data.map((a) => a.storage_path).filter(Boolean) as string[],
      );
      return { avarias: data as Avaria[], urls };
    },
  });

  const avarias = data?.avarias ?? [];

  async function adicionar() {
    if (!ponto) {
      toast.error("Toque no desenho do veículo para marcar o local");
      return;
    }
    const { error } = await supabase.from("avarias").insert({
      atendimento_id: atendimentoId,
      tipo,
      descricao: descricao.trim() || null,
      pos_x: ponto.x,
      pos_y: ponto.y,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDescricao("");
    setPonto(null);
    await qc.invalidateQueries({ queryKey: ["avarias", atendimentoId] });
    toast.success("Avaria registrada");
  }

  async function excluir(a: Avaria) {
    await supabase.from("avarias").delete().eq("id", a.id);
    if (a.storage_path) await removerArquivo(a.storage_path);
    await qc.invalidateQueries({ queryKey: ["avarias", atendimentoId] });
  }

  async function anexarFoto(file: File) {
    if (!alvo) return;
    try {
      const path = await uploadFoto(atendimentoId, "avaria", file);
      await supabase.from("avarias").update({ storage_path: path }).eq("id", alvo);
      await qc.invalidateQueries({ queryKey: ["avarias", atendimentoId] });
      toast.success("Foto da avaria salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    }
  }

  return (
    <div className="space-y-5">
      <section className="surface-card space-y-4 p-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
          Avarias existentes
        </h3>
        <p className="text-xs text-muted-foreground">
          Toque no desenho no local da avaria e depois preencha os dados.
        </p>
        <div className="flex justify-center">
          <div className="relative">
            <CarDiagram
              marcacoes={[
                ...avarias,
                ...(ponto
                  ? [{ id: "novo", pos_x: ponto.x, pos_y: ponto.y, tipo }]
                  : []),
              ]}
              onPick={(x, y) => setPonto({ x, y })}
              selecionada="novo"
            />
          </div>
        </div>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
        >
          {TIPOS_AVARIA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Ex: Risco profundo na porta dianteira direita."
          className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
        />
        <button
          onClick={adicionar}
          className="w-full rounded-lg bg-primary py-4 text-sm font-extrabold uppercase text-primary-foreground"
        >
          Adicionar avaria
        </button>
      </section>

      <ul className="space-y-3">
        {avarias.map((a, i) => (
          <li key={a.id} className="surface-card space-y-3 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {i + 1}. {a.tipo}
                </p>
                {a.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>
                )}
              </div>
              <button
                onClick={() => excluir(a)}
                aria-label="Excluir avaria"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {a.storage_path && data?.urls[a.storage_path] ? (
              <img
                src={data.urls[a.storage_path]}
                alt={`Foto da avaria ${i + 1}`}
                className="h-40 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setAlvo(a.id);
                    fotoRef.current?.click();
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-xs font-bold uppercase"
                >
                  <Camera className="size-4" /> Tirar foto
                </button>
                <button
                  onClick={() => {
                    setAlvo(a.id);
                    galeriaRef.current?.click();
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-xs font-bold uppercase"
                >
                  <Images className="size-4" /> Galeria
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <input
        ref={fotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void anexarFoto(file);
        }}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void anexarFoto(file);
        }}
      />

    </div>
  );
}
