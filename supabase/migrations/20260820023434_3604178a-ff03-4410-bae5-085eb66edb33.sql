CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_all" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  placa text NOT NULL,
  ano text,
  modelo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX veiculos_placa_idx ON public.veiculos (placa);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos TO authenticated;
GRANT ALL ON public.veiculos TO service_role;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veiculos_all" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE SEQUENCE public.atendimento_numero_seq START 1;
CREATE TABLE public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL DEFAULT nextval('public.atendimento_numero_seq'),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Entrada realizada',
  km_entrada text,
  km_saida text,
  reclamacao text,
  diagnostico text,
  servicos_realizados text,
  obs_mecanico text,
  saida_estado text,
  saida_observacoes text,
  saida_pendencias text,
  saida_recomendacoes text,
  assinatura_data_url text,
  assinatura_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT USAGE, SELECT ON SEQUENCE public.atendimento_numero_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos TO authenticated;
GRANT ALL ON public.atendimentos TO service_role;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atendimentos_all" ON public.atendimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER atendimentos_updated_at BEFORE UPDATE ON public.atendimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  etapa text NOT NULL,
  item text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fotos_atendimento_idx ON public.fotos (atendimento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotos TO authenticated;
GRANT ALL ON public.fotos TO service_role;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos_all" ON public.fotos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.avarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text,
  pos_x numeric,
  pos_y numeric,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX avarias_atendimento_idx ON public.avarias (atendimento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avarias TO authenticated;
GRANT ALL ON public.avarias TO service_role;
ALTER TABLE public.avarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avarias_all" ON public.avarias FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  etapa text NOT NULL,
  item text NOT NULL,
  status text NOT NULL DEFAULT 'Não verificado',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (atendimento_id, etapa, item)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_all" ON public.checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'trocada',
  nome text NOT NULL,
  marca text,
  quantidade numeric NOT NULL DEFAULT 1,
  observacao text,
  destino_peca_antiga text NOT NULL DEFAULT 'Não informado',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pecas_atendimento_idx ON public.pecas (atendimento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pecas TO authenticated;
GRANT ALL ON public.pecas TO service_role;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pecas_all" ON public.pecas FOR ALL TO authenticated USING (true) WITH CHECK (true);