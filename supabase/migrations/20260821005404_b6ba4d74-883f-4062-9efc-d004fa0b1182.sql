CREATE OR REPLACE FUNCTION private.pode_ver_atendimento(_atendimento_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.is_staff() OR EXISTS (
    SELECT 1 FROM public.atendimentos a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE a.id = _atendimento_id AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.pode_ver_arquivo(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE at_id uuid;
BEGIN
  IF private.is_staff() THEN RETURN true; END IF;
  BEGIN
    at_id := split_part(_name, '/', 1)::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  RETURN private.pode_ver_atendimento(at_id);
END; $$;

REVOKE ALL ON FUNCTION private.pode_ver_atendimento(uuid) FROM public;
REVOKE ALL ON FUNCTION private.pode_ver_arquivo(text) FROM public;
GRANT EXECUTE ON FUNCTION private.pode_ver_atendimento(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.pode_ver_arquivo(text) TO authenticated, service_role;