/*
# Configuração de Gateway de E-mail para Disparo de Campanhas

## Explicação em português simples
Adiciona colunas à tabela `store_settings` para configurar o provedor
de e-mail usado no disparo real das campanhas de lançamento de e-books
e das automações de marketing. O projeto usa a API da Resend
(https://resend.com) como gateway de e-mail por padrão, por ser
gratuita até 3.000 e-mails/mês e simples de configurar.

## Colunas adicionadas em `store_settings`
- `email_gateway_enabled` (boolean, default false): liga/desliga o
  disparo real de e-mails.
- `email_provider` (text, default 'resend'): provedor do gateway.
- `resend_api_key` (text, nullable): chave de API da Resend
  (re_xxx...). Usada apenas no servidor (edge function), nunca
  exposta no navegador.
- `email_from_name` (text, nullable): nome do remetente exibido
  (ex: "João Art's").
- `email_from_address` (text, nullable): endereço de remetente
  verificado na Resend (ex: "contato@joaoarts.com.br").

## Segurança
- As colunas `resend_api_key` ficam na tabela `store_settings` que
  já possui RLS ativo. Apenas o admin (authenticated) lê e grava.
  A edge function usa a service role key, que bypassa RLS.
- Nenhuma nova tabela é criada.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'email_gateway_enabled'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN email_gateway_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'email_provider'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN email_provider text NOT NULL DEFAULT 'resend';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'resend_api_key'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN resend_api_key text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'email_from_name'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN email_from_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'email_from_address'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN email_from_address text;
  END IF;
END $$;