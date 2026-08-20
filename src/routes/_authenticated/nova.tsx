import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { formatarPlaca } from "@/lib/oficina";

export const Route = createFileRoute("/_authenticated/nova")({
  head: () => ({
    meta: [
      { title: "Nova entrada — Mecânica Alto Torque" },
      { name: "description", content: "Registrar a entrada de um veículo na oficina." },
      { property: "og:title", content: "Nova entrada — Mecânica Alto Torque" },
      { property: "og:description", content: "Registrar a entrada de um veículo na oficina." },
    ],
  }),
  component: Nova,
});

function Nova() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [km, setKm] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || placa.length < 5) {
      toast.error("Informe o nome do cliente e a placa");
      return;
    }
    setSalvando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const { data: cli, error: e1 } = await supabase
        .from("clientes")
        .insert({ nome: cliente.trim(), telefone: telefone.trim() || null, created_by: uid })
        .select("id")
        .single();
      if (e1) throw e1;

      const { data: vei, error: e2 } = await supabase
        .from("veiculos")
        .insert({
          cliente_id: cli.id,
          placa,
          ano: ano || null,
          modelo: modelo.trim() || null,
        })
        .select("id")
        .single();
      if (e2) throw e2;

      const { data: at, error: e3 } = await supabase
        .from("atendimentos")
        .insert({
          cliente_id: cli.id,
          veiculo_id: vei.id,
          km_entrada: km || null,
          created_by: uid,
        })
        .select("id")
        .single();
      if (e3) throw e3;

      toast.success("Atendimento criado");
      navigate({ to: "/atendimento/$id", params: { id: at.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar atendimento");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <AppHeader titulo="Nova entrada" voltar="/inicio" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <form onSubmit={criar} className="space-y-5">
          <section className="surface-card space-y-3 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-primary">Cliente</h2>
            <Campo label="Nome do cliente" value={cliente} onChange={setCliente} required />
            <Campo label="WhatsApp (opcional)" value={telefone} onChange={setTelefone} type="tel" />
          </section>

          <section className="surface-card space-y-3 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-primary">Veículo</h2>
            <Campo
              label="Placa"
              value={placa}
              onChange={(v) => setPlaca(formatarPlaca(v))}
              required
            />
            <Campo label="Modelo (opcional)" value={modelo} onChange={setModelo} />
            <Campo label="Ano" value={ano} onChange={setAno} type="number" />
            <Campo label="Quilometragem de entrada" value={km} onChange={setKm} type="number" />
          </section>

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-xl bg-primary py-5 text-base font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Iniciar checklist"}
          </button>
        </form>
      </main>
    </>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        required={required}
        maxLength={80}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-lg border border-input bg-secondary px-4 py-3 text-base"
      />
    </label>
  );
}
