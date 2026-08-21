import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "funcionario" | "cliente";

/** Papel do usuário logado (validado também no banco por RLS). */
export function usePapel() {
  const q = useQuery({
    queryKey: ["papel"],
    staleTime: 60_000,
    queryFn: async (): Promise<{ papel: Papel | null; ativo: boolean }> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return { papel: null, ativo: true };
      const [{ data, error }, { data: perfil }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("ativo").eq("id", uid).maybeSingle(),
      ]);
      if (error) throw error;
      const ativo = perfil?.ativo ?? true;
      const roles = (data ?? []).map((r) => r.role as Papel);
      let papel: Papel | null = null;
      if (roles.includes("admin")) papel = "admin";
      else if (roles.includes("funcionario")) papel = "funcionario";
      else if (roles.includes("cliente")) papel = "cliente";
      return { papel, ativo };
    },
  });

  const ativo = q.data?.ativo ?? true;
  const papel = ativo ? (q.data?.papel ?? null) : null;
  return {
    papel,
    ativo,
    inativo: !ativo,
    carregando: q.isLoading,
    isAdmin: papel === "admin",
    isEquipe: papel === "admin" || papel === "funcionario",
    isCliente: papel === "cliente",
  };
}
