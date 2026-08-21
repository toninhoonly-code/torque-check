import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "funcionario" | "cliente";

/** Papel do usuário logado (validado também no banco por RLS). */
export function usePapel() {
  const q = useQuery({
    queryKey: ["papel"],
    staleTime: 60_000,
    queryFn: async (): Promise<Papel | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as Papel);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("funcionario")) return "funcionario";
      if (roles.includes("cliente")) return "cliente";
      return null;
    },
  });

  const papel = q.data ?? null;
  return {
    papel,
    carregando: q.isLoading,
    isAdmin: papel === "admin",
    isEquipe: papel === "admin" || papel === "funcionario",
    isCliente: papel === "cliente",
  };
}
