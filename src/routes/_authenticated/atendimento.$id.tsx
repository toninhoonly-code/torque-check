import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  ChevronLeft,
  FileDown,
  FileSignature,
  Loader2,
  MessageCircle,
  Package,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { SecaoAvarias } from "@/components/atendimento/SecaoAvarias";
import { SecaoChecklist } from "@/components/atendimento/SecaoChecklist";
import { SecaoFotos } from "@/components/atendimento/SecaoFotos";
import { SecaoPecas } from "@/components/atendimento/SecaoPecas";
import { SignaturePad, type SignatureHandle } from "@/components/SignaturePad";
import { supabase } from "@/integrations/supabase/client";
import {
  FOTOS_ENTRADA,
  FOTOS_SAIDA_SUGESTOES,
  FOTOS_SERVICO_SUGESTOES,
  OFICINA,
  STATUS_ATENDIMENTO,
  dataHora,
} from "@/lib/oficina";
import { gerarPdf, type DadosPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/atendimento/$id")({
  head: () => ({
    meta: [
      { title: "Atendimento — Mecânica Alto Torque" },
      { name: "description", content: "Detalhes e controle do atendimento veicular." },
      { property: "og:title", content: "Atendimento — Mecânica Alto Torque" },
      { property: "og:description", content: "Detalhes e controle do atendimento veicular." },
    ],
  }),
  component: DetalheAtendimento,
});

type Aba = "entrada" | "avarias" | "checklist" | "servico" | "pecas" | "saida" | "finalizacao";

const ABAS: { id: Aba; label: string; icon: typeof Camera }[] = [
  { id: "entrada", label: "Entrada & Fotos", icon: Camera },
  { id: "avarias", label: "Avarias", icon: AlertTriangle },
  { id: "checklist", label: "Checklist Entrada", icon: CheckCircle2 },
  { id: "servico", label: "Serviço & Mecânica", icon: Wrench },
  { id: "pecas", label: "Peças", icon: Package },
  { id: "saida", label: "Saída & Entrega", icon: Car },
  { id: "finalizacao", label: "Assinatura & PDF", icon: FileSignature },
];

function DetalheAtendimento() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("entrada");
  const [sigHandle, setSigHandle] = useState<SignatureHandle | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [salvandoServico, setSalvandoServico] = useState(false);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  // Form states
  const [kmEntrada, setKmEntrada] = useState("");
  const [reclamacao, setReclamacao] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [servicos, setServicos] = useState("");
  const [obsMecanico, setObsMecanico] = useState("");

  // Saída states
  const [kmSaida, setKmSaida] = useState("");
  const [saidaEstado, setSaidaEstado] = useState("");
  const [saidaObs, setSaidaObs] = useState("");
  const [saidaPendencias, setSaidaPendencias] = useState("");
  const [saidaRecomendacoes, setSaidaRecomendacoes] = useState("");

  const { data: at, isLoading } = useQuery({
    queryKey: ["atendimento", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("*, clientes(*), veiculos(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Preenche dados quando carregados
  useEffect(() => {
    if (at) {
      setKmEntrada(at.km_entrada ?? "");
      setReclamacao(at.reclamacao ?? "");
      setDiagnostico(at.diagnostico ?? "");
      setServicos(at.servicos_realizados ?? "");
      setObsMecanico(at.obs_mecanico ?? "");
      setKmSaida(at.km_saida ?? "");
      setSaidaEstado(at.saida_estado ?? "");
      setSaidaObs(at.saida_observacoes ?? "");
      setSaidaPendencias(at.saida_pendencias ?? "");
      setSaidaRecomendacoes(at.saida_recomendacoes ?? "");
    }
  }, [at]);

  async function atualizarStatus(novoStatus: string) {
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["atendimento", id] });
      await qc.invalidateQueries({ queryKey: ["andamento"] });
      await qc.invalidateQueries({ queryKey: ["historico"] });
      toast.success(`Status atualizado para: ${novoStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  }

  async function salvarDadosServico() {
    setSalvandoServico(true);
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          km_entrada: kmEntrada.trim() || null,
          reclamacao: reclamacao.trim() || null,
          diagnostico: diagnostico.trim() || null,
          servicos_realizados: servicos.trim() || null,
          obs_mecanico: obsMecanico.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["atendimento", id] });
      toast.success("Dados do serviço salvos!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar dados");
    } finally {
      setSalvandoServico(false);
    }
  }

  async function salvarDadosSaida() {
    setSalvandoSaida(true);
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          km_saida: kmSaida.trim() || null,
          saida_estado: saidaEstado.trim() || null,
          saida_observacoes: saidaObs.trim() || null,
          saida_pendencias: saidaPendencias.trim() || null,
          saida_recomendacoes: saidaRecomendacoes.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["atendimento", id] });
      toast.success("Dados de saída salvos!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar dados");
    } finally {
      setSalvandoSaida(false);
    }
  }

  async function salvarAssinatura() {
    if (!sigHandle) return;
    const dataUrl = sigHandle.toDataUrl();
    if (!dataUrl) {
      toast.error("Por favor, faça a assinatura na tela antes de salvar.");
      return;
    }
    setSalvandoAssinatura(true);
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          assinatura_data_url: dataUrl,
          assinatura_em: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["atendimento", id] });
      toast.success("Assinatura do cliente salva com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar assinatura");
    } finally {
      setSalvandoAssinatura(false);
    }
  }

  async function limparAssinaturaBanco() {
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          assinatura_data_url: null,
          assinatura_em: null,
        })
        .eq("id", id);
      if (error) throw error;
      sigHandle?.clear();
      await qc.invalidateQueries({ queryKey: ["atendimento", id] });
      toast.success("Assinatura removida. Assine novamente abaixo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao limpar assinatura");
    }
  }

  async function handleGerarPdf() {
    if (!at) return;
    setGerandoPdf(true);
    try {
      const [fotosRes, avariasRes, checklistsRes, pecasRes] = await Promise.all([
        supabase.from("fotos").select("etapa, item, storage_path").eq("atendimento_id", id),
        supabase
          .from("avarias")
          .select("tipo, descricao, pos_x, pos_y, storage_path")
          .eq("atendimento_id", id),
        supabase
          .from("checklists")
          .select("etapa, item, status, observacao")
          .eq("atendimento_id", id),
        supabase
          .from("pecas")
          .select("tipo, nome, marca, quantidade, observacao, destino_peca_antiga")
          .eq("atendimento_id", id),
      ]);

      const dadosParaPdf: DadosPdf = {
        atendimento: {
          numero: at.numero,
          status: at.status,
          created_at: at.created_at,
          km_entrada: at.km_entrada,
          km_saida: at.km_saida,
          reclamacao: at.reclamacao,
          diagnostico: at.diagnostico,
          servicos_realizados: at.servicos_realizados,
          obs_mecanico: at.obs_mecanico,
          saida_estado: at.saida_estado,
          saida_observacoes: at.saida_observacoes,
          saida_pendencias: at.saida_pendencias,
          saida_recomendacoes: at.saida_recomendacoes,
          assinatura_data_url: at.assinatura_data_url,
        },
        cliente: {
          nome: at.clientes?.nome ?? "Cliente não informado",
        },
        veiculo: {
          placa: at.veiculos?.placa ?? "SEM-PLACA",
          ano: at.veiculos?.ano ?? null,
          modelo: at.veiculos?.modelo ?? null,
        },
        fotos: (fotosRes.data ?? []) as DadosPdf["fotos"],
        avarias: (avariasRes.data ?? []) as DadosPdf["avarias"],
        checklists: (checklistsRes.data ?? []) as DadosPdf["checklists"],
        pecas: (pecasRes.data ?? []).map((p) => ({
          ...p,
          quantidade: Number(p.quantidade) || 1,
        })) as DadosPdf["pecas"],
      };

      await gerarPdf(dadosParaPdf);
      toast.success("PDF gerado e baixado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setGerandoPdf(false);
    }
  }

  function compartilharWhatsApp() {
    if (!at) return;
    const foneLimpo = (at.clientes?.telefone ?? "").replace(/\D/g, "");
    const texto = encodeURIComponent(
      `Olá, *${at.clientes?.nome}*! 👋\n\n` +
        `Aqui é da *${OFICINA.nome}* (${OFICINA.cidade}).\n\n` +
        `📋 *Atendimento Nº ${at.numero}*\n` +
        `🚗 Veículo: *${at.veiculos?.placa}* ${at.veiculos?.modelo ? `(${at.veiculos.modelo})` : ""}\n` +
        `📌 Status atual: *${at.status}*\n\n` +
        (at.servicos_realizados ? `🔧 *Serviços:* ${at.servicos_realizados}\n\n` : "") +
        `Para mais informações ou dúvidas, fale conosco pelo WhatsApp: ${OFICINA.whatsapp}.\n` +
        `Obrigado pela confiança!`,
    );

    const url = foneLimpo ? `https://wa.me/55${foneLimpo}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(url, "_blank");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Carregando atendimento...</p>
      </div>
    );
  }

  if (!at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Atendimento não encontrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O registro solicitado pode ter sido excluído ou não existe.
        </p>
        <button
          onClick={() => navigate({ to: "/inicio" })}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header Superior Fixo */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/inicio" })}
              className="grid size-10 place-items-center rounded-lg bg-secondary text-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold uppercase tracking-wide">
                  Nº {at.numero}
                </span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-black tracking-wider text-primary">
                  {at.veiculos?.placa}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {at.clientes?.nome} • {dataHora(at.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGerarPdf}
              disabled={gerandoPdf}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-extrabold uppercase text-primary-foreground disabled:opacity-60"
              title="Gerar PDF"
            >
              {gerandoPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
            {at.clientes?.telefone && (
              <button
                onClick={compartilharWhatsApp}
                className="grid size-9 place-items-center rounded-lg bg-[color:var(--color-success)] text-[color:var(--color-success-foreground)]"
                title="WhatsApp do Cliente"
                aria-label="Enviar mensagem no WhatsApp"
              >
                <MessageCircle className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Dropdown / Barra de Controle */}
        <div className="border-t border-border/60 bg-card px-4 py-2">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Status:</span>
            <select
              value={at.status}
              onChange={(e) => atualizarStatus(e.target.value)}
              className="h-9 rounded-lg border border-input bg-secondary px-3 text-xs font-extrabold text-foreground"
            >
              {STATUS_ATENDIMENTO.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navegação por Abas com Scroll Lateral no Celular */}
        <nav className="no-scrollbar flex overflow-x-auto border-t border-border bg-secondary/50 px-2 py-1">
          <div className="mx-auto flex gap-1">
            {ABAS.map((aba) => {
              const ativo = abaAtiva === aba.id;
              const Icone = aba.icon;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-extrabold uppercase transition-colors ${
                    ativo
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icone className="size-3.5" />
                  <span>{aba.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Conteúdo Principal de Acordo com a Aba Selecionada */}
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        {/* Resumo do Veículo e Cliente */}
        <section className="surface-card space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Cliente</p>
              <p className="font-extrabold">{at.clientes?.nome}</p>
              {at.clientes?.telefone && (
                <a
                  href={`tel:${at.clientes.telefone}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary"
                >
                  <MessageCircle className="size-3" /> {at.clientes.telefone}
                </a>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Veículo</p>
              <p className="font-extrabold tracking-wide text-foreground">
                {at.veiculos?.placa}{" "}
                {at.veiculos?.modelo ? (
                  <span className="font-normal text-muted-foreground">
                    ({at.veiculos.modelo})
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {at.veiculos?.ano ? `Ano ${at.veiculos.ano} • ` : ""}
                {at.km_entrada ? `${at.km_entrada} KM entrada` : "KM não informado"}
              </p>
            </div>
          </div>
        </section>

        {/* 1. ABA ENTRADA & FOTOS */}
        {abaAtiva === "entrada" && (
          <div className="space-y-5">
            <section className="surface-card space-y-3 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Dados Iniciais da Entrada
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    KM de Entrada
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={kmEntrada}
                    onChange={(e) => setKmEntrada(e.target.value)}
                    placeholder="Ex: 85400"
                    className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    onClick={salvarDadosServico}
                    disabled={salvandoServico}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-xs font-extrabold uppercase text-foreground hover:bg-secondary/80 disabled:opacity-60"
                  >
                    <Save className="size-4" />
                    {salvandoServico ? "Salvando..." : "Salvar KM"}
                  </button>
                </div>
              </div>
            </section>

            <SecaoFotos
              atendimentoId={id}
              etapa="entrada"
              grupos={FOTOS_ENTRADA}
              titulo="Checklist Fotográfico de Entrada"
            />
          </div>
        )}

        {/* 2. ABA AVARIAS */}
        {abaAtiva === "avarias" && <SecaoAvarias atendimentoId={id} />}

        {/* 3. ABA CHECKLIST ENTRADA */}
        {abaAtiva === "checklist" && (
          <div className="space-y-4">
            <div className="surface-card p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Checklist de Entrada
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione o estado de cada componente do veículo ao dar entrada na oficina.
              </p>
            </div>
            <SecaoChecklist atendimentoId={id} etapa="entrada" />
          </div>
        )}

        {/* 4. ABA SERVIÇO & MECÂNICA */}
        {abaAtiva === "servico" && (
          <div className="space-y-5">
            <section className="surface-card space-y-4 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Registro dos Serviços & Diagnóstico
              </h3>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Reclamação do Cliente
                </span>
                <textarea
                  value={reclamacao}
                  onChange={(e) => setReclamacao(e.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Ex: Barulho na suspensão dianteira ao passar em lombadas."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Diagnóstico Encontrado
                </span>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Ex: Bieletas e buchas da barra estabilizadora com folga excessiva."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Serviços Realizados
                </span>
                <textarea
                  value={servicos}
                  onChange={(e) => setServicos(e.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Ex: Troca do par de bieletas dianteiras, substituição das buchas e alinhamento."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Observações do Mecânico
                </span>
                <textarea
                  value={obsMecanico}
                  onChange={(e) => setObsMecanico(e.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Ex: Próxima revisão recomendada em 10.000 KM ou 6 meses."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <button
                onClick={salvarDadosServico}
                disabled={salvandoServico}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                <Save className="size-4" />
                {salvandoServico ? "Salvando..." : "Salvar informações do serviço"}
              </button>
            </section>

            <SecaoFotos
              atendimentoId={id}
              etapa="servico"
              sugestoes={FOTOS_SERVICO_SUGESTOES}
              titulo="Fotos do Serviço & Peças"
            />
          </div>
        )}

        {/* 5. ABA PEÇAS */}
        {abaAtiva === "pecas" && <SecaoPecas atendimentoId={id} />}

        {/* 6. ABA SAÍDA & ENTREGA */}
        {abaAtiva === "saida" && (
          <div className="space-y-5">
            <section className="surface-card space-y-4 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Checklist de Saída
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    KM de Saída
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={kmSaida}
                    onChange={(e) => setKmSaida(e.target.value)}
                    placeholder="Ex: 85420"
                    className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Estado Geral de Saída
                  </span>
                  <input
                    type="text"
                    value={saidaEstado}
                    onChange={(e) => setSaidaEstado(e.target.value)}
                    placeholder="Ex: Testado e aprovado"
                    maxLength={100}
                    className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Pendências (se houver)
                </span>
                <input
                  type="text"
                  value={saidaPendencias}
                  onChange={(e) => setSaidaPendencias(e.target.value)}
                  placeholder="Ex: Nenhuma pendência"
                  maxLength={200}
                  className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Recomendações ao Cliente
                </span>
                <textarea
                  value={saidaRecomendacoes}
                  onChange={(e) => setSaidaRecomendacoes(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Ex: Reapertar rodas após 500 KM rodados."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Observações de Saída
                </span>
                <textarea
                  value={saidaObs}
                  onChange={(e) => setSaidaObs(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Ex: Veículo entregue limpo com todas as ferramentas e peças antigas."
                  className="w-full rounded-lg border border-input bg-secondary p-3 text-base"
                />
              </label>

              <button
                onClick={salvarDadosSaida}
                disabled={salvandoSaida}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                <Save className="size-4" />
                {salvandoSaida ? "Salvando..." : "Salvar dados de saída"}
              </button>
            </section>

            <section className="space-y-2">
              <h3 className="px-1 text-sm font-extrabold uppercase tracking-wide text-primary">
                Conferência de Itens na Saída
              </h3>
              <SecaoChecklist atendimentoId={id} etapa="saida" />
            </section>

            <SecaoFotos
              atendimentoId={id}
              etapa="saida"
              sugestoes={FOTOS_SAIDA_SUGESTOES}
              titulo="Fotos de Saída do Veículo"
            />
          </div>
        )}

        {/* 7. ABA ASSINATURA & PDF */}
        {abaAtiva === "finalizacao" && (
          <div className="space-y-5">
            <section className="surface-card space-y-4 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Confirmação do Cliente
              </h3>

              <div className="rounded-lg border border-border bg-secondary p-4 text-sm leading-relaxed text-foreground">
                <p className="font-medium">
                  "Declaro que conferi as condições do veículo registradas neste checklist e estou
                  ciente das informações apresentadas."
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Cliente: <strong className="text-foreground">{at.clientes?.nome}</strong>
                </p>
              </div>

              {at.assinatura_data_url ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-[color:var(--color-success)]">
                    ✓ Assinatura coletada {at.assinatura_em ? `em ${dataHora(at.assinatura_em)}` : ""}
                  </p>
                  <div className="rounded-xl border border-border bg-white p-2">
                    <img
                      src={at.assinatura_data_url}
                      alt="Assinatura do cliente"
                      className="h-36 w-full object-contain"
                    />
                  </div>
                  <button
                    onClick={limparAssinaturaBanco}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-xs font-extrabold uppercase text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Limpar e assinar novamente
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Assine com o dedo ou caneta touch no quadro branco abaixo:
                  </p>
                  <SignaturePad onRef={setSigHandle} />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => sigHandle?.clear()}
                      className="rounded-lg bg-secondary py-3 text-xs font-extrabold uppercase text-muted-foreground"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={salvarAssinatura}
                      disabled={salvandoAssinatura}
                      className="rounded-lg bg-primary py-3 text-xs font-extrabold uppercase text-primary-foreground disabled:opacity-60"
                    >
                      {salvandoAssinatura ? "Salvando..." : "Salvar assinatura"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Ações Finais: Gerar PDF e WhatsApp */}
            <section className="surface-card space-y-3 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Finalização & Documentos
              </h3>

              <button
                onClick={handleGerarPdf}
                disabled={gerandoPdf}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                {gerandoPdf ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Gerando documento PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="size-5" />
                    Gerar e Baixar PDF Profissional
                  </>
                )}
              </button>

              <button
                onClick={compartilharWhatsApp}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-success)] py-3.5 text-sm font-extrabold uppercase tracking-wide text-[color:var(--color-success-foreground)]"
              >
                <MessageCircle className="size-5" />
                Enviar Resumo no WhatsApp do Cliente
              </button>

              {at.status !== "Entregue" && (
                <button
                  onClick={() => atualizarStatus("Entregue")}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-sm font-extrabold uppercase text-foreground hover:border-primary"
                >
                  <CheckCircle2 className="size-5 text-[color:var(--color-success)]" />
                  Marcar Veículo como Entregue
                </button>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
