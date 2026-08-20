import type { MouseEvent } from "react";

export type Marcacao = { id: string; pos_x: number | null; pos_y: number | null; tipo: string };

/** Desenho simples do veículo visto de cima, usado para marcar avarias. */
export function CarDiagram({
  marcacoes,
  onPick,
  selecionada,
}: {
  marcacoes: Marcacao[];
  onPick?: (x: number, y: number) => void;
  selecionada?: string | null;
}) {
  function click(e: MouseEvent<SVGSVGElement>) {
    if (!onPick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPick(Number(x.toFixed(2)), Number(y.toFixed(2)));
  }

  return (
    <svg
      viewBox="0 0 100 180"
      onClick={click}
      className="w-full max-w-[240px] cursor-crosshair select-none rounded-xl border border-border bg-secondary"
      role="img"
      aria-label="Desenho do veículo para marcar avarias"
    >
      <rect x="14" y="8" width="72" height="164" rx="26" fill="#2a2a2a" stroke="#8a8a8a" />
      <path d="M26 40 h48 l-6 -18 a4 4 0 0 0 -3 -2 h-30 a4 4 0 0 0 -3 2 z" fill="#4a4a4a" />
      <path d="M26 128 h48 l-6 18 a4 4 0 0 1 -3 2 h-30 a4 4 0 0 1 -3 -2 z" fill="#4a4a4a" />
      <rect x="28" y="52" width="44" height="64" rx="8" fill="#3a3a3a" stroke="#6a6a6a" />
      <rect x="8" y="34" width="8" height="20" rx="3" fill="#111" />
      <rect x="84" y="34" width="8" height="20" rx="3" fill="#111" />
      <rect x="8" y="120" width="8" height="20" rx="3" fill="#111" />
      <rect x="84" y="120" width="8" height="20" rx="3" fill="#111" />
      <text x="50" y="18" textAnchor="middle" fontSize="7" fill="#bbb">
        FRENTE
      </text>
      <text x="50" y="170" textAnchor="middle" fontSize="7" fill="#bbb">
        TRASEIRA
      </text>
      {marcacoes
        .filter((m) => m.pos_x != null && m.pos_y != null)
        .map((m, i) => (
          <g key={m.id}>
            <circle
              cx={(m.pos_x! / 100) * 100}
              cy={(m.pos_y! / 100) * 180}
              r={selecionada === m.id ? 7 : 5.5}
              fill="#e11d2e"
              stroke="#fff"
              strokeWidth="1.2"
            />
            <text
              x={(m.pos_x! / 100) * 100}
              y={(m.pos_y! / 100) * 180 + 2.5}
              textAnchor="middle"
              fontSize="6"
              fill="#fff"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        ))}
    </svg>
  );
}
