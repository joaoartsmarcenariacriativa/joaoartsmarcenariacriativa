-- Período atual do dashboard: singleton com data de início.
-- O dashboard só conta pedidos criados a partir de period_start.
-- "Zerar dashboard" = baixar relatório do período e avançar period_start para agora.
CREATE TABLE IF NOT EXISTS dashboard_period (
  id integer PRIMARY KEY DEFAULT 1,
  period_start timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_period_singleton CHECK (id = 1)
);

INSERT INTO dashboard_period (id, period_start) VALUES (1, now())
  ON CONFLICT (id) DO NOTHING;

-- Apenas admins (service role via edge function) atualizam; o painel admin
-- usa a chave anônima/authenticated, então liberamos update para authenticated
-- já que o painel admin já está protegido por rota.
ALTER TABLE dashboard_period ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_dashboard_period" ON dashboard_period;
CREATE POLICY "read_dashboard_period"
  ON dashboard_period FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_dashboard_period" ON dashboard_period;
CREATE POLICY "update_dashboard_period"
  ON dashboard_period FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
