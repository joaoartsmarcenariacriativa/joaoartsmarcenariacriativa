/*
# Create store_settings and site_content tables

## Overview
Makes every piece of site content editable from the admin panel.
No more hardcoded store name, footer text, policies, or section titles.

## New Tables
1. store_settings - Single-row table for global settings (store name, logo, colors, contact info, free shipping threshold, pix discount)
2. site_content - Key-value table for all editable texts (footer text, announcement bar, section titles, policy texts)

## Security
- Public (anon) can READ both tables so the storefront renders
- Only authenticated (admin) can INSERT/UPDATE/DELETE
*/

-- ============ STORE SETTINGS ============
CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'João Art''s Marcenaria Criativa',
  store_short_name text NOT NULL DEFAULT 'João Art''s',
  store_tagline text NOT NULL DEFAULT 'Marcenaria Criativa',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#b45309',
  announcement_text text NOT NULL DEFAULT 'Frete grátis em compras acima de R$ 200 • Parcelamos em até 12x sem juros',
  whatsapp_number text NOT NULL DEFAULT '5511999999999',
  whatsapp_message text NOT NULL DEFAULT 'Olá, vim pelo site da João Art''s',
  email_contact text NOT NULL DEFAULT 'joaoartsmarcenariacriativa@gmail.com',
  instagram_url text,
  facebook_url text,
  free_shipping_threshold numeric(10,2) NOT NULL DEFAULT 200,
  pix_discount_percent numeric(5,2) NOT NULL DEFAULT 5,
  max_installments integer NOT NULL DEFAULT 12,
  cnpj text,
  footer_about text NOT NULL DEFAULT 'Peças artesanais em madeira, feitas com dedicação e amor. Tábuas, móveis, decorações e muito mais para sua casa.',
  updated_at timestamptz DEFAULT now()
);

-- Ensure only one row
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_settings" ON store_settings;
CREATE POLICY "public_read_store_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_store_settings" ON store_settings;
CREATE POLICY "admin_update_store_settings" ON store_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_insert_store_settings" ON store_settings;
CREATE POLICY "admin_insert_store_settings" ON store_settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ SITE CONTENT ============
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_content" ON site_content;
CREATE POLICY "admin_insert_site_content" ON site_content FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_update_site_content" ON site_content FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_site_content" ON site_content;
CREATE POLICY "admin_delete_site_content" ON site_content FOR DELETE
  TO authenticated USING (true);

-- ============ SEED SITE CONTENT ============
INSERT INTO site_content (key, value, category) VALUES
-- Section titles on home page
('home_categories_title', 'Categorias', 'home'),
('home_featured_title', 'Destaques', 'home'),
('home_newarrivals_title', 'Novidades', 'home'),
('home_cta_title', 'Presenteie com arte em madeira', 'home'),
('home_cta_text', 'Peças exclusivas e personalizadas para tornar cada momento especial. Feitas à mão com materiais nobres.', 'home'),
('home_cta_button', 'Explorar Coleção', 'home'),

-- Trust badges
('trust_badge1_title', 'Feito à Mão', 'trust'),
('trust_badge1_desc', 'Cada peça única e artesanal', 'trust'),
('trust_badge2_title', 'Garantia de Fábrica', 'trust'),
('trust_badge2_desc', 'Qualidade garantida em todas as peças', 'trust'),
('trust_badge3_title', 'Entrega Segura', 'trust'),
('trust_badge3_desc', 'Envio para todo o Brasil', 'trust'),
('trust_badge4_title', 'Madeira Sustentável', 'trust'),
('trust_badge4_desc', 'Matéria-prima de origem responsável', 'trust'),

-- Footer
('footer_nav_title', 'Navegação', 'footer'),
('footer_policies_title', 'Políticas', 'footer'),
('footer_contact_title', 'Atendimento', 'footer'),
('footer_copyright', 'Todos os direitos reservados.', 'footer'),

-- Policies (full text, pipe-separated sections: heading|text)
('policy_privacidade', 'Coleta de Dados|A João Art''s Marcenaria Criativa coleta apenas os dados necessários para processar seus pedidos, incluindo nome, e-mail, telefone e endereço de entrega. Não compartilhamos seus dados com terceiros, exceto quando necessário para a entrega (transportadoras) ou por obrigação legal.||Uso dos Dados|Seus dados são utilizados exclusivamente para: processamento de pedidos, comunicação sobre o status do pedido, envio de código de rastreio e suporte ao cliente. Não enviamos spam nem vendemos seus dados.||LGPD|Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar, corrigir ou solicitar a exclusão de seus dados a qualquer momento. Para isso, entre em contato pelo e-mail joaoartsmarcenariacriativa@gmail.com.||Cookies|Utilizamos cookies essenciais para o funcionamento da loja, como carrinho de compras e preferências. Você pode gerenciar os cookies nas configurações do seu navegador.', 'policy'),

('policy_trocas', 'Prazo para Devolução|Você tem até 7 dias corridos após o recebimento para solicitar a devolução de produtos não personalizados, conforme o Código de Defesa do Consumidor. Produtos personalizados não podem ser devolvidos, exceto em caso de defeito de fabricação.||Condições|O produto deve ser devolvido em sua embalagem original, sem sinais de uso e com todos os acessórios. O custo de envio da devolução é por nossa conta em caso de defeito, e por conta do cliente em caso de desistência.||Reembolso|O reembolso será processado em até 10 dias úteis após o recebimento e conferência do produto. O valor será estornado no mesmo método de pagamento utilizado na compra.||Garantia de Fábrica|Todos os nossos produtos possuem garantia de 90 dias contra defeitos de fabricação. Não cobrimos danos causados por mau uso, exposição excessiva à umidade ou falta de manutenção conforme as instruções de cuidados.', 'policy'),

('policy_entregas', 'Prazo de Produção|Cada peça é feita à mão e possui um prazo de produção artesanal específico, que varia de 2 a 15 dias úteis conforme o produto. Este prazo está indicado em cada página de produto.||Prazo de Entrega|O prazo total de entrega é a soma do prazo de produção + prazo de transporte. O transporte varia conforme a região, geralmente entre 3 a 10 dias úteis. O prazo total é calculado no momento da compra.||Frete Grátis|Oferecemos frete grátis para compras acima de R$ 200,00 para todo o Brasil. Para compras menores, o valor do frete é calculado no carrinho com base no CEP de destino.||Rastreamento|Após o envio, você receberá o código de rastreio por e-mail e WhatsApp. Você pode acompanhar seu pedido diretamente no site dos Correios ou da transportadora.', 'policy'),

('policy_termos', 'Aceitação|Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.||Produtos|Por se tratarem de produtos artesanais em madeira, pode haver variação natural de cor, veios e textura entre as peças. As imagens são ilustrativas e cada peça é única.||Preços e Disponibilidade|Os preços e a disponibilidade dos produtos podem sofrer alterações sem aviso prévio. O pedido só é confirmado após a aprovação do pagamento.||Propriedade Intelectual|Todo o conteúdo deste site, incluindo textos, imagens, logotipos e designs, é propriedade da João Art''s Marcenaria Criativa e protegido por leis de direitos autorais.', 'policy')
ON CONFLICT (key) DO NOTHING;
