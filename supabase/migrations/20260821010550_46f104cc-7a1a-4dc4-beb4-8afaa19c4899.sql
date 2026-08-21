
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Admin pode gerenciar dados de perfil (nome/status)
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());

-- Conta ativa?
CREATE OR REPLACE FUNCTION private.is_ativo(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private'
AS $$
  SELECT COALESCE((SELECT p.ativo FROM public.profiles p WHERE p.id = _user_id), false);
$$;
REVOKE ALL ON FUNCTION private.is_ativo(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION private.is_ativo(uuid) TO authenticated, service_role;

-- Contas desativadas perdem imediatamente os poderes de equipe/admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private'
AS $$
  SELECT private.is_ativo(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private'
AS $$
  SELECT private.is_ativo(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','funcionario')
  );
$$;

-- Nunca deixar o sistema sem administrador ativo
CREATE OR REPLACE FUNCTION private.proteger_ultimo_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','private'
AS $$
DECLARE restantes int;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.ativo = false AND OLD.ativo = true
       AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.id AND ur.role='admin') THEN
      SELECT count(*) INTO restantes FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
       WHERE ur.role='admin' AND p.ativo AND ur.user_id <> NEW.id;
      IF restantes = 0 THEN
        RAISE EXCEPTION 'Não é possível desativar o último administrador ativo';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- user_roles: impedir remover/rebaixar o último admin
  IF (TG_OP = 'DELETE' AND OLD.role = 'admin')
     OR (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN
    SELECT count(*) INTO restantes FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
     WHERE ur.role='admin' AND p.ativo AND ur.user_id <> OLD.user_id;
    IF restantes = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS profiles_proteger_admin ON public.profiles;
CREATE TRIGGER profiles_proteger_admin BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.proteger_ultimo_admin();

DROP TRIGGER IF EXISTS user_roles_proteger_admin ON public.user_roles;
CREATE TRIGGER user_roles_proteger_admin BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION private.proteger_ultimo_admin();

-- Guardar e-mail no perfil para exibição na administração
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','private'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;
