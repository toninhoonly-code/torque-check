import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito ao administrador");
}

/** Lista contas de login com o papel atual (somente admin). */
export const listarUsuarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: papeis } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      criado_em: u.created_at,
      papel: (papeis ?? []).find((p) => p.user_id === u.id)?.role ?? null,
    }));
  });

/** Define o papel de uma conta (somente admin). */
export const definirPapel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        papel: z.enum(["admin", "funcionario", "cliente"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && data.papel !== "admin") {
      throw new Error("Você não pode remover o seu próprio acesso de administrador");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.papel });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Vincula (ou desvincula) uma conta de login a um cliente da oficina. */
export const vincularCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        clienteId: z.string().uuid(),
        userId: z.string().uuid().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("clientes")
      .update({ user_id: data.userId })
      .eq("id", data.clienteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Exclusão definitiva de registros (somente admin), removendo arquivos do storage. */
export const excluirRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tipo: z.enum(["cliente", "veiculo", "atendimento"]),
        id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let atendimentoIds: string[] = [];
    if (data.tipo === "atendimento") {
      atendimentoIds = [data.id];
    } else {
      const coluna = data.tipo === "cliente" ? "cliente_id" : "veiculo_id";
      const { data: ats } = await supabaseAdmin
        .from("atendimentos")
        .select("id")
        .eq(coluna, data.id);
      atendimentoIds = (ats ?? []).map((a) => a.id);
    }

    for (const atId of atendimentoIds) {
      const { data: arquivos } = await supabaseAdmin.storage
        .from("atendimentos")
        .list(atId, { limit: 1000 });
      for (const pasta of arquivos ?? []) {
        const { data: itens } = await supabaseAdmin.storage
          .from("atendimentos")
          .list(`${atId}/${pasta.name}`, { limit: 1000 });
        const caminhos = (itens ?? []).map((i) => `${atId}/${pasta.name}/${i.name}`);
        if (caminhos.length) await supabaseAdmin.storage.from("atendimentos").remove(caminhos);
      }
      await supabaseAdmin.from("fotos").delete().eq("atendimento_id", atId);
      await supabaseAdmin.from("avarias").delete().eq("atendimento_id", atId);
      await supabaseAdmin.from("checklists").delete().eq("atendimento_id", atId);
      await supabaseAdmin.from("pecas").delete().eq("atendimento_id", atId);
      await supabaseAdmin.from("atendimentos").delete().eq("id", atId);
    }

    if (data.tipo === "veiculo") {
      await supabaseAdmin.from("veiculos").delete().eq("id", data.id);
    }
    if (data.tipo === "cliente") {
      await supabaseAdmin.from("veiculos").delete().eq("cliente_id", data.id);
      await supabaseAdmin.from("clientes").delete().eq("id", data.id);
    }
    return { ok: true, atendimentos: atendimentoIds.length };
  });
