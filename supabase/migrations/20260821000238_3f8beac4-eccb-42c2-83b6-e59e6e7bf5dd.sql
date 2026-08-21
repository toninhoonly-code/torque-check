-- 1) Corrige o cadastro: o serviço de autenticação precisa executar o gatilho
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 2) Papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario', 'cliente');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO supabase_auth_admin;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'funcionario')
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

CREATE POLICY "user_roles_select_self_or_staff" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY "user_roles_admin_insert" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "user_roles_admin_update" ON public.user_roles
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "user_roles_admin_delete" ON public.user_roles
FOR DELETE TO authenticated USING (public.is_admin());

-- 3) Primeiro usuário vira admin; demais entram como funcionário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  primeiro boolean;
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', ''))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO primeiro;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN primeiro THEN 'admin'::public.app_role ELSE 'funcionario'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 4) Vínculo do cliente com a conta de acesso
ALTER TABLE public.clientes ADD COLUMN user_id uuid;
CREATE INDEX clientes_user_id_idx ON public.clientes (user_id);

CREATE OR REPLACE FUNCTION public.pode_ver_atendimento(_atendimento_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff() OR EXISTS (
    SELECT 1 FROM public.atendimentos a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE a.id = _atendimento_id AND c.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.pode_ver_atendimento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_atendimento(uuid) TO authenticated;

-- 5) Novas políticas
DROP POLICY IF EXISTS "clientes_all" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT TO authenticated USING (public.is_staff() OR user_id = auth.uid());
CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "clientes_delete" ON public.clientes
FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "veiculos_all" ON public.veiculos;
CREATE POLICY "veiculos_select" ON public.veiculos
FOR SELECT TO authenticated USING (
  public.is_staff() OR EXISTS (
    SELECT 1 FROM public.clientes c WHERE c.id = veiculos.cliente_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "veiculos_insert" ON public.veiculos
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "veiculos_update" ON public.veiculos
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "veiculos_delete" ON public.veiculos
FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "atendimentos_all" ON public.atendimentos;
CREATE POLICY "atendimentos_select" ON public.atendimentos
FOR SELECT TO authenticated USING (
  public.is_staff() OR EXISTS (
    SELECT 1 FROM public.clientes c WHERE c.id = atendimentos.cliente_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "atendimentos_insert" ON public.atendimentos
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "atendimentos_update" ON public.atendimentos
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "atendimentos_delete" ON public.atendimentos
FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "fotos_all" ON public.fotos;
CREATE POLICY "fotos_select" ON public.fotos
FOR SELECT TO authenticated USING (public.pode_ver_atendimento(atendimento_id));
CREATE POLICY "fotos_insert" ON public.fotos
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "fotos_update" ON public.fotos
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "fotos_delete" ON public.fotos
FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "avarias_all" ON public.avarias;
CREATE POLICY "avarias_select" ON public.avarias
FOR SELECT TO authenticated USING (public.pode_ver_atendimento(atendimento_id));
CREATE POLICY "avarias_insert" ON public.avarias
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "avarias_update" ON public.avarias
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "avarias_delete" ON public.avarias
FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "checklists_all" ON public.checklists;
CREATE POLICY "checklists_select" ON public.checklists
FOR SELECT TO authenticated USING (public.pode_ver_atendimento(atendimento_id));
CREATE POLICY "checklists_insert" ON public.checklists
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "checklists_update" ON public.checklists
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "checklists_delete" ON public.checklists
FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "pecas_all" ON public.pecas;
CREATE POLICY "pecas_select" ON public.pecas
FOR SELECT TO authenticated USING (public.pode_ver_atendimento(atendimento_id));
CREATE POLICY "pecas_insert" ON public.pecas
FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "pecas_update" ON public.pecas
FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "pecas_delete" ON public.pecas
FOR DELETE TO authenticated USING (public.is_staff());

-- 6) Arquivos: mesma regra do atendimento (pasta raiz = id do atendimento)
CREATE OR REPLACE FUNCTION public.pode_ver_arquivo(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  at_id uuid;
BEGIN
  IF public.is_staff() THEN RETURN true; END IF;
  BEGIN
    at_id := split_part(_name, '/', 1)::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  RETURN public.pode_ver_atendimento(at_id);
END; $$;
REVOKE ALL ON FUNCTION public.pode_ver_arquivo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_arquivo(text) TO authenticated;

DROP POLICY IF EXISTS "atendimentos_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "atendimentos_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "atendimentos_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "atendimentos_bucket_delete" ON storage.objects;

CREATE POLICY "atendimentos_bucket_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'atendimentos' AND public.pode_ver_arquivo(name));
CREATE POLICY "atendimentos_bucket_insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'atendimentos' AND public.is_staff());
CREATE POLICY "atendimentos_bucket_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'atendimentos' AND public.is_staff())
WITH CHECK (bucket_id = 'atendimentos' AND public.is_staff());
CREATE POLICY "atendimentos_bucket_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'atendimentos' AND public.is_staff());