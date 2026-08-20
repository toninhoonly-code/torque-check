import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import logo from "@/assets/logo.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { OFICINA } from "@/lib/oficina";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mecânica Alto Torque — Check-in de Veículos" },
      {
        name: "description",
        content:
          "Sistema de check-in de veículos da Mecânica Alto Torque em Sorriso - MT: fotos, avarias, checklists, peças e PDF do atendimento.",
      },
      { property: "og:title", content: "Mecânica Alto Torque — Check-in de Veículos" },
      {
        property: "og:description",
        content:
          "Registro de entrada e saída de veículos com fotos, avarias, peças, assinatura do cliente e PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img src={logo.url} alt="Logo Mecânica Alto Torque" className="w-60 rounded-2xl" />
      <h1 className="mt-6 text-2xl font-extrabold uppercase tracking-wide">
        Check-in de Veículos
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Entrada e saída de veículos com registro fotográfico, avarias, peças, assinatura do cliente
        e PDF profissional.
      </p>
      <Link
        to="/auth"
        className="mt-8 w-full max-w-xs rounded-xl bg-primary py-5 text-base font-extrabold uppercase tracking-wide text-primary-foreground"
      >
        Entrar
      </Link>
      <p className="mt-8 text-xs text-muted-foreground">
        {OFICINA.nome} • {OFICINA.cidade} • {OFICINA.whatsapp}
      </p>
    </main>
  );
}
