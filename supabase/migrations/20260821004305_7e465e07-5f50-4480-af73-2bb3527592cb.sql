CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_admin() SET SCHEMA private;
ALTER FUNCTION public.is_staff() SET SCHEMA private;
ALTER FUNCTION public.pode_ver_atendimento(uuid) SET SCHEMA private;
ALTER FUNCTION public.pode_ver_arquivo(text) SET SCHEMA private;

ALTER FUNCTION private.handle_new_user() SET search_path = public, private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public, private;
ALTER FUNCTION private.is_admin() SET search_path = public, private;
ALTER FUNCTION private.is_staff() SET search_path = public, private;
ALTER FUNCTION private.pode_ver_atendimento(uuid) SET search_path = public, private;
ALTER FUNCTION private.pode_ver_arquivo(text) SET search_path = public, private;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.pode_ver_atendimento(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.pode_ver_arquivo(text) TO authenticated, service_role;