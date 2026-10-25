/*
# Adiciona coluna label_url à tabela orders

1. Coluna nova em `orders`
- `label_url` (text, nullable): link/URL da etiqueta de frete gerada
  automaticamente pelo Melhor Envio ou SuperFrete. Guardada separadamente
  do `tracking_code` (que é só o código de rastreio) para permitir abrir
  o PDF da etiqueta diretamente no painel admin.

2. Segurança
- Nenhuma alteração de RLS ou grants — a coluna herda as policies
  existentes da tabela `orders`. Apenas adiciona a coluna.

3. Notas
- Idempotente (DO $$ / IF NOT EXISTS).
- Não altera dados existentes — todos os pedidos antigos ficam com
  label_url NULL e seguem funcionando normalmente.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'label_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN label_url text;
  END IF;
END $$;
