import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ListaAtendimentos } from "@/components/ListaAtendimentos";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/andamento")({
  head: () => ({
    meta: [
      { title: "Em andamento — Mecânica Alto Torque" },
      { name: "description", content: "Atendimentos em andamento na oficina." },
      { property: "og:title", content: "Em andamento — Mecânica Alto Torque" },
      { property: "og:description", content: "Atendimentos em andamento na oficina." },
    ],
  }),
  component: Andamento,
});

function Andamento() {
  const { data, isLoading } = useQuery({
    queryKey: ["andamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("id, numero, status, created_at, clientes(nome), veiculos(placa, modelo)")
        .neq("status", "Entregue")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <AppHeader titulo="Em andamento" voltar="/inicio" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ListaAtendimentos
          itens={data ?? []}
          carregando={isLoading}
          vazio="Nenhum atendimento em andamento."
        />
      </main>
    </>
  );
}
