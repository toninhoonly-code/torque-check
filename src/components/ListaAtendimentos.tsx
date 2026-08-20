import { Link } from "@tanstack/react-router";
import { dataHora } from "@/lib/oficina";

export type ItemAtendimento = {
  id: string;
  numero: number;
  status: string;
  created_at: string;
  clientes: { nome: string } | null;
  veiculos: { placa: string; modelo: string | null } | null;
};

export function ListaAtendimentos({
  itens,
  carregando,
  vazio,
}: {
  itens: ItemAtendimento[];
  carregando?: boolean;
  vazio: string;
}) {
  if (carregando) return <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>;
  if (itens.length === 0)
    return <p className="py-10 text-center text-sm text-muted-foreground">{vazio}</p>;

  return (
    <ul className="space-y-3">
      {itens.map((a) => (
        <li key={a.id}>
          <Link
            to="/atendimento/$id"
            params={{ id: a.id }}
            className="surface-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-wide">
                {a.veiculos?.placa ?? "—"}
                {a.veiculos?.modelo ? (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {a.veiculos.modelo}
                  </span>
                ) : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">{a.clientes?.nome}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nº {a.numero} • {dataHora(a.created_at)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase text-primary">
              {a.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
