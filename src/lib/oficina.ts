export const OFICINA = {
  nome: "Mecânica Alto Torque",
  cidade: "Sorriso - MT",
  whatsapp: "(66) 99679-2393",
};

export const FOTOS_ENTRADA: { grupo: string; itens: string[] }[] = [
  { grupo: "Externas", itens: ["Frente", "Traseira", "Lateral esquerda", "Lateral direita", "Teto"] },
  {
    grupo: "Rodas",
    itens: [
      "Roda dianteira esquerda",
      "Roda dianteira direita",
      "Roda traseira esquerda",
      "Roda traseira direita",
    ],
  },
  { grupo: "Internas", itens: ["Banco dianteiro", "Banco traseiro", "Painel", "Porta-malas"] },
  { grupo: "Mecânicas", itens: ["Motor", "Bateria", "Outros detalhes"] },
];

export const TOTAL_FOTOS_ENTRADA = FOTOS_ENTRADA.reduce((a, g) => a + g.itens.length, 0);

export const FOTOS_SERVICO_SUGESTOES = [
  "Peça antiga",
  "Peça nova",
  "Componente danificado",
  "Serviço realizado",
  "Motor desmontado",
  "Resultado do reparo",
];

export const FOTOS_SAIDA_SUGESTOES = [
  "Frente",
  "Traseira",
  "Lateral esquerda",
  "Lateral direita",
  "Interior",
  "Painel",
];

export const CHECKLIST_ITENS = [
  "Estado geral da carroceria",
  "Vidros",
  "Espelhos",
  "Faróis",
  "Lanternas",
  "Pneus",
  "Rodas",
  "Bancos",
  "Tapetes",
  "Painel",
  "Som/multimídia",
  "Chaves",
  "Combustível",
  "Objetos deixados dentro do veículo",
];

export const CHECKLIST_STATUS = ["OK", "Com avaria", "Não verificado"] as const;

export const TIPOS_AVARIA = [
  "Risco",
  "Amassado",
  "Trinca",
  "Quebra",
  "Peça danificada",
  "Peça faltando",
  "Outro",
];

export const STATUS_ATENDIMENTO = [
  "Entrada realizada",
  "Em diagnóstico",
  "Em serviço",
  "Aguardando peça",
  "Aguardando aprovação",
  "Serviço concluído",
  "Aguardando retirada",
  "Entregue",
] as const;

export const STATUS_FINALIZADOS = ["Entregue"];

export const DESTINOS_PECA_ANTIGA = [
  "Peça antiga entregue ao cliente",
  "Peça antiga ficou na oficina",
  "Peça antiga descartada",
  "Não informado",
];

export function formatarPlaca(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function dataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
