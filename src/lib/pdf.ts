import { jsPDF } from "jspdf";
import logo from "@/assets/logo.asset.json";
import { OFICINA, dataHora } from "@/lib/oficina";
import { urlParaDataUrl, urlsAssinadas } from "@/lib/fotos";

const VERMELHO: [number, number, number] = [200, 25, 40];
const CINZA: [number, number, number] = [110, 110, 110];

export type DadosPdf = {
  atendimento: {
    numero: number;
    status: string;
    created_at: string;
    km_entrada: string | null;
    km_saida: string | null;
    reclamacao: string | null;
    diagnostico: string | null;
    servicos_realizados: string | null;
    obs_mecanico: string | null;
    saida_estado: string | null;
    saida_observacoes: string | null;
    saida_pendencias: string | null;
    saida_recomendacoes: string | null;
    assinatura_data_url: string | null;
  };
  cliente: { nome: string };
  veiculo: { placa: string; ano: string | null; modelo: string | null };
  fotos: { etapa: string; item: string; storage_path: string }[];
  avarias: {
    tipo: string;
    descricao: string | null;
    pos_x: number | null;
    pos_y: number | null;
    storage_path: string | null;
  }[];
  checklists: { etapa: string; item: string; status: string; observacao: string | null }[];
  pecas: {
    tipo: string;
    nome: string;
    marca: string | null;
    quantidade: number;
    observacao: string | null;
    destino_peca_antiga: string;
  }[];
};

function desenhoAvariasDataUrl(
  avarias: { pos_x: number | null; pos_y: number | null }[],
): Promise<string> {
  const w = 300;
  const h = 540;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#eeeeee";
  const r = 70;
  ctx.beginPath();
  ctx.roundRect(42, 24, w - 84, h - 48, r);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#cccccc";
  ctx.beginPath();
  ctx.roundRect(84, 156, w - 168, 200, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#666";
  ctx.font = "bold 18px Helvetica";
  ctx.textAlign = "center";
  ctx.fillText("FRENTE", w / 2, 60);
  ctx.fillText("TRASEIRA", w / 2, h - 40);
  avarias.forEach((a, i) => {
    if (a.pos_x == null || a.pos_y == null) return;
    const x = (a.pos_x / 100) * w;
    const y = (a.pos_y / 100) * h;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#c81928";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px Helvetica";
    ctx.fillText(String(i + 1), x, y + 5);
  });
  return Promise.resolve(canvas.toDataURL("image/jpeg", 0.85));
}

export async function gerarPdf(d: DadosPdf) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 14;
  let y = 0;

  const logoData = await urlParaDataUrl(logo.url).catch(() => "");
  const paths = [
    ...d.fotos.map((f) => f.storage_path),
    ...d.avarias.map((a) => a.storage_path).filter(Boolean),
  ] as string[];
  const signed = await urlsAssinadas(paths);
  const imagens: Record<string, string> = {};
  for (const p of paths) {
    if (signed[p]) {
      try {
        imagens[p] = await urlParaDataUrl(signed[p]);
      } catch {
        /* ignora foto indisponível */
      }
    }
  }

  function cabecalho() {
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, W, 30, "F");
    if (logoData) doc.addImage(logoData, "JPEG", M, 4, 22, 22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(OFICINA.nome, M + 26, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${OFICINA.cidade}  •  WhatsApp ${OFICINA.whatsapp}`, M + 26, 18);
    doc.setTextColor(...VERMELHO);
    doc.setFont("helvetica", "bold");
    doc.text(`ATENDIMENTO Nº ${d.atendimento.numero}`, W - M, 12, { align: "right" });
    doc.setTextColor(220, 220, 220);
    doc.setFont("helvetica", "normal");
    doc.text(dataHora(d.atendimento.created_at), W - M, 18, { align: "right" });
    doc.text(d.atendimento.status, W - M, 24, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 38;
  }

  function novaPagina() {
    doc.addPage();
    cabecalho();
  }

  function espaco(h: number) {
    if (y + h > 282) novaPagina();
  }

  function titulo(t: string) {
    espaco(16);
    doc.setFillColor(...VERMELHO);
    doc.rect(M, y, W - 2 * M, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(t.toUpperCase(), M + 3, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 11;
  }

  function linha(rotulo: string, valor?: string | null) {
    if (!valor) return;
    const texto = doc.splitTextToSize(valor, W - 2 * M - 40);
    espaco(6 + texto.length * 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(rotulo, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(texto, M + 40, y);
    y += texto.length * 5 + 2;
  }

  function paragrafo(t?: string | null) {
    if (!t) return;
    const linhas = doc.splitTextToSize(t, W - 2 * M);
    espaco(linhas.length * 5 + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(linhas, M, y);
    y += linhas.length * 5 + 3;
  }

  function grade(fotos: { item: string; storage_path: string }[]) {
    const cols = 3;
    const gap = 4;
    const lw = (W - 2 * M - gap * (cols - 1)) / cols;
    const lh = lw * 0.75;
    let col = 0;
    fotos.forEach((f) => {
      const img = imagens[f.storage_path];
      if (!img) return;
      if (col === 0) espaco(lh + 10);
      const x = M + col * (lw + gap);
      doc.addImage(img, "JPEG", x, y, lw, lh);
      doc.setFontSize(7);
      doc.setTextColor(...CINZA);
      doc.text(doc.splitTextToSize(f.item, lw)[0] ?? "", x, y + lh + 3.5);
      doc.setTextColor(0, 0, 0);
      col++;
      if (col === cols) {
        col = 0;
        y += lh + 8;
      }
    });
    if (col !== 0) y += lh + 8;
  }

  cabecalho();

  titulo("Cliente");
  linha("Nome", d.cliente.nome);

  titulo("Veículo");
  linha("Placa", d.veiculo.placa);
  linha("Modelo", d.veiculo.modelo);
  linha("Ano", d.veiculo.ano);
  linha("KM entrada", d.atendimento.km_entrada);
  linha("KM saída", d.atendimento.km_saida);

  const fotosEntrada = d.fotos.filter((f) => f.etapa === "entrada");
  if (fotosEntrada.length) {
    titulo("Fotos de entrada");
    grade(fotosEntrada);
  }

  if (d.avarias.length) {
    titulo("Avarias existentes");
    const desenho = await desenhoAvariasDataUrl(d.avarias);
    espaco(80);
    doc.addImage(desenho, "JPEG", M, y, 42, 75);
    let ay = y;
    d.avarias.forEach((a, i) => {
      const txt = doc.splitTextToSize(
        `${i + 1}. ${a.tipo}${a.descricao ? " — " + a.descricao : ""}`,
        W - 2 * M - 50,
      );
      doc.setFontSize(9);
      doc.text(txt, M + 48, ay + 4);
      ay += txt.length * 5 + 2;
    });
    y = Math.max(y + 78, ay + 4);
    const fotosAvaria = d.avarias
      .filter((a) => a.storage_path)
      .map((a, i) => ({ item: `Avaria ${i + 1} - ${a.tipo}`, storage_path: a.storage_path! }));
    if (fotosAvaria.length) grade(fotosAvaria);
  }

  const chEntrada = d.checklists.filter((c) => c.etapa === "entrada");
  if (chEntrada.length) {
    titulo("Checklist de entrada");
    chEntrada.forEach((c) => linha(c.item, c.status + (c.observacao ? ` — ${c.observacao}` : "")));
  }

  titulo("Serviço realizado");
  linha("Reclamação", d.atendimento.reclamacao);
  linha("Diagnóstico", d.atendimento.diagnostico);
  linha("Serviços", d.atendimento.servicos_realizados);
  linha("Observações", d.atendimento.obs_mecanico);

  const trocadas = d.pecas.filter((p) => p.tipo === "trocada");
  if (trocadas.length) {
    titulo("Peças trocadas");
    trocadas.forEach((p) => {
      linha(
        p.nome,
        `${p.marca ? p.marca + " • " : ""}Qtd ${p.quantidade} • ${p.destino_peca_antiga}${
          p.observacao ? " • " + p.observacao : ""
        }`,
      );
    });
  }

  const recomendadas = d.pecas.filter((p) => p.tipo === "recomendada");
  if (recomendadas.length) {
    titulo("Peças recomendadas");
    recomendadas.forEach((p) =>
      linha(p.nome, `${p.marca ? p.marca + " • " : ""}Qtd ${p.quantidade}${p.observacao ? " • " + p.observacao : ""}`),
    );
  }

  const fotosServico = d.fotos.filter((f) => f.etapa === "servico");
  if (fotosServico.length) {
    titulo("Fotos do serviço");
    grade(fotosServico);
  }

  const chSaida = d.checklists.filter((c) => c.etapa === "saida");
  if (chSaida.length || d.atendimento.saida_estado) {
    titulo("Checklist de saída");
    chSaida.forEach((c) => linha(c.item, c.status + (c.observacao ? ` — ${c.observacao}` : "")));
    linha("Estado geral", d.atendimento.saida_estado);
    linha("Observações", d.atendimento.saida_observacoes);
    linha("Pendências", d.atendimento.saida_pendencias);
    linha("Recomendações", d.atendimento.saida_recomendacoes);
  }

  const fotosSaida = d.fotos.filter((f) => f.etapa === "saida");
  if (fotosSaida.length) {
    titulo("Fotos de saída");
    grade(fotosSaida);
  }

  titulo("Assinatura do cliente");
  paragrafo(
    "Declaro que conferi as condições do veículo registradas neste checklist e estou ciente das informações apresentadas.",
  );
  if (d.atendimento.assinatura_data_url) {
    espaco(38);
    doc.addImage(d.atendimento.assinatura_data_url, "PNG", M, y, 80, 30);
    y += 33;
  }
  doc.setFontSize(9);
  doc.text(d.cliente.nome, M, y + 4);
  doc.setDrawColor(...CINZA);
  doc.line(M, y, M + 80, y);
  y += 12;

  espaco(20);
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 275, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(OFICINA.nome, W / 2, 283, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(OFICINA.cidade, W / 2, 288, { align: "center" });
  doc.text(OFICINA.whatsapp, W / 2, 293, { align: "center" });

  const nome = `Atendimento-${d.atendimento.numero}-${d.veiculo.placa}.pdf`;
  doc.save(nome);
}
