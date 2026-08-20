import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, LogOut } from "lucide-react";
import logo from "@/assets/logo.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { OFICINA } from "@/lib/oficina";

export function AppHeader({ titulo, voltar }: { titulo?: string; voltar?: string }) {
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        {voltar ? (
          <Link
            to={voltar}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <img
            src={logo.url}
            alt="Logo Mecânica Alto Torque"
            className="size-10 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold uppercase tracking-wide">
            {titulo ?? OFICINA.nome}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{OFICINA.cidade}</p>
        </div>
        <button
          onClick={sair}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground"
          aria-label="Sair"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
