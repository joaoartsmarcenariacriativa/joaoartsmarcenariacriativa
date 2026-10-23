-- Módulo 1: Motor de automação — registra execuções de réguas de relacionamento.

CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES marketing_automations(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  recipient_email text,
  recipient_phone text,
  customer_name text,
  order_number text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_automation_runs" ON automation_runs;
CREATE POLICY "admin_read_automation_runs" ON automation_runs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_automation_runs" ON automation_runs;
CREATE POLICY "admin_insert_automation_runs" ON automation_runs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_automation_runs" ON automation_runs;
CREATE POLICY "admin_update_automation_runs" ON automation_runs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_automation_runs" ON automation_runs;
CREATE POLICY "admin_delete_automation_runs" ON automation_runs FOR DELETE
  TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON automation_runs TO authenticated;

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON automation_runs(created_at DESC);

-- Trigger: quando o status de um pedido muda, registra um evento de automação.
CREATE OR REPLACE FUNCTION trigger_order_status_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO automation_runs (trigger_type, recipient_email, recipient_phone, customer_name, order_number, payload)
    VALUES (
      'order_status',
      NEW.email,
      NEW.phone,
      NEW.customer_name,
      NEW.order_number,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'order_id', NEW.id,
        'total', NEW.total
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_status_automation ON orders;
CREATE TRIGGER orders_status_automation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_status_automation();
