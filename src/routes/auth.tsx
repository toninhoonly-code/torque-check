import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { OFICINA } from "@/lib/oficina";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso — Mecânica Alto Torque" },
      {
        name: "description",
        content: "Área restrita da equipe da Mecânica Alto Torque em Sorriso - MT.",
      },
      { property: "og:title", content: "Acesso — Mecânica Alto Torque" },
      {
        property: "og:description",
        content: "Área restrita da equipe da Mecânica Alto Torque em Sorriso - MT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/inicio", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/inicio", replace: true });
        else toast.success("Conta criada! Confirme o e-mail para acessar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setCarregando(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <img src={logo.url} alt="Logo Mecânica Alto Torque" className="mb-6 w-52 rounded-xl" />
      <h1 className="text-center text-xl font-extrabold uppercase tracking-wide">
        Check-in de Veículos
      </h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {OFICINA.cidade} • {OFICINA.whatsapp}
      </p>

      <form onSubmit={enviar} className="surface-card mt-8 w-full max-w-sm space-y-3 p-5">
        {modo === "cadastro" && (
          <input
            className="h-12 w-full rounded-lg border border-input bg-secondary px-4 text-base"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={80}
          />
        )}
        <input
          type="email"
          className="h-12 w-full rounded-lg border border-input bg-secondary px-4 text-base"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={120}
        />
        <input
          type="password"
          className="h-12 w-full rounded-lg border border-input bg-secondary px-4 text-base"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={carregando}
          className="h-13 w-full rounded-lg bg-primary py-4 text-sm font-extrabold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          onClick={google}
          className="w-full rounded-lg border border-border bg-secondary py-4 text-sm font-bold uppercase text-foreground"
        >
          Entrar com Google
        </button>
        <button
          type="button"
          onClick={() => setModo(modo === "login" ? "cadastro" : "login")}
          className="w-full py-2 text-xs text-muted-foreground underline"
        >
          {modo === "login" ? "Criar conta da equipe" : "Já tenho conta"}
        </button>
      </form>
    </main>
  );
}
