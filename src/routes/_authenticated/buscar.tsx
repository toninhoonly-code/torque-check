import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ListaAtendimentos } from "@/components/ListaAtendimentos";
import { supabase } from "@/integrations/supabase/client";
import { formatarPlaca } from "@/lib/oficina";

export const Route = createFileRoute("/_authenticated/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar pela placa — Mecânica Alto Torque" },
      { name: "description", content: "Busca rápida de atendimentos pela placa do veículo." },
      { property: "og:title", content: "Buscar pela placa — Mecânica Alto Torque" },
      { property: "og:description", content: "Busca rápida de atendimentos pela placa do veículo." },
    ],
  }),
  component: Buscar,
});

function Buscar() {
  const [placa, setPlaca] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["buscar-placa", placa],
    enabled: placa.length >= 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("id, numero, status, created_at, clientes(nome), veiculos!inner(placa, modelo)")
        .ilike("veiculos.placa", `%${placa}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <AppHeader titulo="Buscar pela placa" voltar="/inicio" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <input
          value={placa}
          onChange={(e) => setPlaca(formatarPlaca(e.target.value))}
          placeholder="ABC1D23"
          className="h-14 w-full rounded-xl border border-input bg-secondary px-4 text-center text-xl font-extrabold tracking-[0.3em]"
        />
        {placa.length < 3 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Digite ao menos 3 caracteres da placa.
          </p>
        ) : (
          <ListaAtendimentos
            itens={data ?? []}
            carregando={isFetching}
            vazio="Nenhum atendimento encontrado."
          />
        )}
      </main>
    </>
  );
}
