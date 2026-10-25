# PROMPT UNIVERSAL — Loja E-commerce Completa com Painel Admin, E-books, Pagamentos e Logística

> **COMO USAR**: Preencha a secao CONFIGURACAO abaixo com o seu nicho. O resto do prompt referencia essas variaveis automaticamente. Copie tudo (incluindo a secao CONFIGURACAO preenchida) e cole como prompt para gerar o site completo.

---

## CONFIGURACAO (PREENCHA ANTES DE GERAR)

```
[NOME_DA_LOJA] = (ex: Joao Art's, Bella Cosmeticos, Tech Store)
[NOME_CURTO]   = (ex: Joao Art's, Bella, Tech)
[TAGLINE]      = (ex: Marcenaria Criativa, Cosmeticos Naturais, Gadgets Premium)
[NICHO]        = (ex: produtos artesanais em madeira, cosmeticos naturais, eletronicos e gadgets)
[TIPO_PRODUTO] = (ex: pecas artesanais, produtos naturais, dispositivos eletronicos)
[UNIDADE_PRODUTO] = (ex: peca, item, produto, kit)
[ADMIN_EMAIL]  = (ex: admin@sualoja.com.br)
[E_MAIL_CONTATO] = (ex: contato@sualoja.com.br)
[WHATSAPP]     = (ex: 5511999999999)
[MSG_WHATSAPP] = (ex: Ola, vim pelo site)
[PREFIXO_PEDIDO] = (ex: JA, BC, TS — 2 letras)
[INSTAGRAM_URL] = (ex: https://instagram.com/sualoja)
[FACEBOOK_URL]  = (ex: https://facebook.com/sualoja)
[CNPJ]          = (ex: 00.000.000/0001-00)
[CEP_ORIGEM]    = (ex: 01000000)
[FRETE_GRATIS_THRESHOLD] = (ex: 200)
[DESCONTO_PIX] = (ex: 5)
[PARCELAS_MAX] = (ex: 12)

[COR_PRIMARIA]      = (ex: #8B6F47 — cor principal/CTAs)
[COR_PRIMARIA_ESCURA] = (ex: #6B5436 — hover/escuro)
[COR_SECUNDARIA]    = (ex: #B8916A — detalhes)
[COR_FUNDO]         = (ex: #F8F5EF — fundo principal)
[COR_TEXTO]         = (ex: #2A2018 — texto principal/escuro)
[COR_SUCESSO]       = (ex: #6B7B4F — sucesso/confirmacoes)
[COR_BORDA]         = (ex: #DBD0C2 — bordas sutis)
[COR_MUTED]         = (ex: #756B61 — texto secundario)
[FONTE_TITULOS]     = (ex: Fraunces, Playfair Display, Montserrat)
[FONTE_CORPO]       = (ex: Inter, system-ui, sans-serif)
[ESTETICA]          = (ex: rustica-artesanal premium, minimalista moderno, clean tech, natural organico)
[ARQUIVO_CSS_VAR]   = (ex: espresso, dark, primary, forest — nome da variavel CSS para COR_TEXTO)

[ANUNCIO_BARRA]    = (ex: Frete gratis em compras acima de R$ 200 • Parcelamos em ate 12x sem juros)
[TEXTO_RODAPE]     = (ex: Pecas artesanais em madeira, feitas com dedicacao e amor.)
[SELOS_CONFIANCA]  = (ex: Feito a Mao;Garantia de Fabrica;Entrega Segura;Madeira Sustentavel — separados por ;)
[CATEGORIAS_INICIAIS] = (ex: Cozinha & Churrasco;Decoracao;Pet & Jardim;Móveis — separados por ;)
[ICONE_CATEGORIA_PADRAO] = (ex: Package — icone lucide-react padrao para categorias sem icone especifico)

[BANDEIRAS_BADGES] = (ex: Feito a Mao,Madeira Noble,Nova Colecao,Mais Vendido — separados por ,)
[TEMPO_PRODUCAO_DEFAULT] = (ex: 7 — dias uteis para producao/preparo padrao)
[ESTOQUE_BAIXO_ALERTA] = (ex: 5 — alerta de estoque baixo no dashboard)
```

---

## OBJETIVO

Criar uma loja e-commerce completa e pronta para producao de [NICHO], com catalogo de produtos fisicos, e-books/infoprodutos com area de membros, checkout com Mercado Pago, calculo de frete multi-transportadora com APIs reais, painel administrativo completo (dashboard, produtos, pedidos Kanban, frete, pagamentos, e-books, cursos, contatos, automacoes, conteudo, reviews, banners, configuracoes), contas de cliente com favoritos e enderecos, conformidade total com a LGPD e o CDC brasileiro, e compra automatica de etiquetas de frete. Tudo 100% editavel pelo painel admin, sem necessidade de mexer no codigo.

---

## STACK TECNOLOGICO

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS 3
- **Icones**: lucide-react
- **Backend/Banco de dados**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Cliente Supabase**: @supabase/supabase-js (singleton com proxy lazy-init, persistSession: true, autoRefreshToken: true)
- **Pagamentos**: Mercado Pago Checkout Pro (redirect flow)
- **Frete**: Melhor Envio, SuperFrete, Frenet (APIs reais) + estimativa local de fallback
- **E-mail transacional/marketing**: Resend (gateway de e-mail, gratuito ate 3.000/mes)
- **E-books checkout**: Hotmart (link externo de checkout)
- **Hospedagem**: Vercel (SPA rewrite: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`)

---

## DESIGN E IDENTIDADE VISUAL

### Paleta de cores (Tailwind custom)
```js
colors: {
  [ARQUIVO_CSS_VAR]: { DEFAULT: '[COR_TEXTO]', tint: '[COR_TEXTO com +10% lightness]', deep: '[COR_TEXTO com -10% lightness]' },
  primary:           { DEFAULT: '[COR_PRIMARIA]', light: '[COR_PRIMARIA com +15% lightness]', dark: '[COR_PRIMARIA_ESCURA]' },
  secondary:         { DEFAULT: '[COR_SECUNDARIA]', light: '[COR_SECUNDARIA com +15% lightness]' },
  success:           { DEFAULT: '[COR_SUCESSO]', light: '[COR_SUCESSO com +15% lightness]' },
  cream:             '[COR_FUNDO]',
  paper:             '#FFFFFF',
  muted:             '[COR_MUTED]',
  rim:               '[COR_BORDA]',
}
```

### Tipografia
- **Serif/Display**: [FONTE_TITULOS] (titulos, numeros de destaque)
- **Sans**: [FONTE_CORPO] (corpo de texto, UI)
- Line-height: 150% body, 120% headings
- Maximo 3 pesos de fonte

### Sombras
- `soft`: `0 2px 8px rgba(42,32,24,0.06)` — cards sutis
- `card`: `0 4px 16px rgba(42,32,24,0.08)` — cards elevados
- `lift`: `0 8px 30px rgba(42,32,24,0.12)` — modais, drawers

### Principios de design
- Estetica [ESTETICA]
- Espacamento base 8px
- Hover states com transicoes suaves (transition-colors, transition-transform)
- Micro-interacoes: scale-105 em botoes, hover:border-primary em cards
- Design responsivo: mobile-first, breakpoints sm/md/lg
- Scrollbar customizada (rim/primary)
- Selection color: primary bg + cream text
- Nunca usar roxo/indigo/violeta

---

## ESTRUTURA DE ROTAS (SPA sem react-router, pushState manual)

| Rota | Pagina | Acesso |
|---|---|---|
| `/` | HomePage (hero, categorias, destaques, novidades, e-books, CTA) | Publico |
| `/produtos` | ProductsPage (filtros por categoria, busca, ordenacao) | Publico |
| `/produto/:slug` | ProductDetailPage (galeria, variacoes, frete, reviews, relacionados) | Publico |
| `/ebooks` | EbooksPage (vitrine de e-books, captura de leads) | Publico |
| `/ebook/:slug` | EbookDetailPage (detalhe, link Hotmart, deteccao de acesso) | Publico |
| `/checkout` | CheckoutPage (3 passos: dados -> pagamento -> confirmacao) | Publico |
| `/pedido-confirmado` | OrderReturnPage (retorno MP, limpa carrinho) | Publico |
| `/meus-pedidos` | MyOrdersPage (busca de pedido por e-mail, sem login) | Publico |
| `/politica/:tipo` | PolicyPage (privacidade, trocas, entregas, termos) | Publico |
| `/entrar` | CustomerLogin (login/cadastro de cliente) | Publico |
| `/minha-conta` | MyAccountPage (dashboard do cliente: pedidos, favoritos, enderecos, perfil) | Cliente logado |
| `/area-de-membros` | MemberAreaPage (player de cursos: video, PDF, texto, embed) | Cliente com acesso |
| `/admin/login` | AdminLogin (e-mail/senha ou Google OAuth) | Publico |
| `/admin` | AdminPanel (shell com sidebar e sub-paginas) | Admin logado |

Aliases de retorno do Mercado Pago: `/pedido-confirmado`, `/order-success`, `/order-confirmation`, `/order-pending`, `/order-failure` — todas renderizam OrderReturnPage.

---

## ESTRUTURA DE ARQUIVOS

```
src/
  App.tsx                          # Roteador SPA (pushState), providers wrapper
  main.tsx                         # Entry point
  index.css                        # Tailwind + CSS variables + scrollbar custom
  vite-env.d.ts
  context/
    AuthContext.tsx                 # Auth provider (isAdmin por e-mail, isCustomer, signIn/signUp/signOut)
    CartContext.tsx                 # Carrinho com localStorage (items, subtotal, shipping, CEP)
    StoreSettingsContext.tsx        # Settings + site_content globais, getText(key, fallback)
  components/
    Header.tsx                      # Nav, busca, carrinho badge, auth links, announcement bar
    Footer.tsx                     # Store info, social, navegacao, politicas, Hotmart notice
    CartDrawer.tsx                  # Drawer lateral, calculo de frete CEP, progress bar frete gratis
    HeroBanner.tsx                  # Carrossel de banners (auto-rotate 5s, crossfade)
    ProductCard.tsx                 # Card de produto (badges, rating, preco, parcelas, favorito)
    SearchBar.tsx                   # Busca com autocomplete debounced (250ms, min 2 chars)
    FavoriteButton.tsx              # Toggle favorito (requer login de cliente)
    ImageUploader.tsx               # Upload drag-and-drop para Supabase Storage (imagens + videos)
    ErrorBoundary.tsx               # Error boundary com fallback UI
  hooks/
    useFavorites.ts                 # Hook de favoritos (load, toggle, optimistic UI)
  lib/
    supabase.ts                     # Cliente Supabase singleton (lazy proxy)
    shipping.ts                     # Wrapper para edge function de cotacao de frete
    format.ts                       # formatBRL, formatParcela, generateOrderNumber
  pages/
    HomePage.tsx
    ProductsPage.tsx
    ProductDetailPage.tsx
    CheckoutPage.tsx
    OrderReturnPage.tsx
    CustomerLogin.tsx
    MyAccountPage.tsx
    MyOrdersPage.tsx
    MemberAreaPage.tsx
    EbooksPage.tsx
    EbookDetailPage.tsx
    PolicyPage.tsx
    AdminLogin.tsx
    AdminPanel.tsx
    admin/
      AdminDashboard.tsx
      AdminProducts.tsx
      AdminOrders.tsx
      AdminCategories.tsx
      AdminReviews.tsx
      AdminBanners.tsx
      AdminContent.tsx
      AdminShipping.tsx
      AdminPayments.tsx
      AdminSettings.tsx
      AdminEbooks.tsx
      AdminCourseBuilder.tsx
      AdminAccessManager.tsx
      AdminLaunchBroadcast.tsx
      AdminAutomations.tsx
      AdminContacts.tsx
  types/
    index.ts                        # Todas as interfaces TypeScript
supabase/
  config.toml                       # Config de edge functions (verify_jwt por funcao)
  functions/
    mp-checkout/index.ts            # Cria preferencia MP Checkout Pro
    mp-webhook/index.ts             # Recebe notificacoes MP, atualiza pedido, compra etiqueta
    shipping-quote/index.ts         # Cotacao multi-transportadora (APIs + fallback local)
    send-launch-broadcast/index.ts  # Dispara campanhas de e-mail via Resend
  migrations/
    [27+ migracoes SQL]
vercel.json                         # SPA rewrite
```

---

## ESQUEMA DO BANCO DE DADOS (Supabase/PostgreSQL)

### Tabelas principais

#### `categories`
- `id` uuid PK, `name` text, `slug` text UNIQUE, `icon` text (nome do icone lucide), `sort_order` int, `created_at`
- RLS: leitura publica, CRUD admin
- Seed: categorias iniciais = [CATEGORIAS_INICIAIS] (separadas por ;)

#### `products`
- `id` uuid PK, `name` text, `slug` text UNIQUE, `description` text, `specs` jsonb, `care_instructions` text
- `price` numeric(10,2), `compare_price` numeric(10,2), `category_id` uuid FK->categories
- `images` text[], `video_url` text, `stock` int, `production_days` int (default [TEMPO_PRODUCAO_DEFAULT]), `max_per_customer` int (default 10)
- `rating` numeric(2,1) (default 5.0), `review_count` int (default 0), `sales_count` int (default 0)
- `badges` text[], `featured` bool, `sort_order` int, `active` bool, `created_at`
- **Especs de frete**: `ship_weight_g` int, `ship_length_cm` numeric(10,1), `ship_width_cm` numeric(10,1), `ship_height_cm` numeric(10,1), `ship_packaging_weight_g` int (default 0), `ship_packaging_cm` int (default 0), `ship_declared_value` numeric(12,2) (nullable = usa price)
- RLS: leitura publica (active=true), CRUD admin

#### `product_variations`
- `id` uuid PK, `product_id` uuid FK->products (CASCADE), `variation_type` text, `variation_value` text, `stock` int, `price_adjustment` numeric(10,2), `created_at`
- RLS: leitura publica, CRUD admin

#### `product_reviews`
- `id` uuid PK, `product_id` uuid FK->products (CASCADE), `customer_name` text, `rating` int (CHECK 1-5), `comment` text
- `photos` text[], `videos` text[] (ambos default '{}')
- `approved` bool (default false), `created_at`
- `customer_id` uuid (nullable), `order_id` uuid (nullable)
- RLS: leitura publica apenas aprovadas (OU proprias reviews), INSERT apenas por compradores autenticados que compraram o produto e nao reviewaram ainda, UPDATE/DELETE admin
- Indice: `(customer_id, product_id)`

#### `banners`
- `id` uuid PK, `title` text, `subtitle` text, `image_url` text, `cta_text` text, `cta_link` text, `sort_order` int, `active` bool, `created_at`
- RLS: leitura publica, CRUD admin

#### `orders`
- `id` uuid PK, `order_number` text UNIQUE, `customer_name` text, `email` text, `phone` text
- `cep` text, `address` text, `city` text, `state` text
- `total` numeric(10,2), `shipping_cost` numeric(10,2) (default 0)
- `status` text (default 'recebido'), `payment_method` text, `payment_status` text (default 'pending')
- `tracking_code` text, `label_url` text (PDF da etiqueta), `notes` text
- `delivered_at` timestamptz, `customer_id` uuid FK->auth.users (SET NULL), `marketing_opt_in` bool (default false)
- `manual_label_required` bool (default false), `label_purchase_error` text
- `shipping_carrier_name` text, `shipping_service_name` text, `shipping_gateway` text ('melhorenvio'|'superfrete'), `shipping_service_id` text
- `created_at`, `updated_at`
- Statuses: `recebido`, `processamento`, `enviado`, `confirmado`, `entregue`, `cancelado`
- RLS: INSERT via funcao SECURITY DEFINER `create_order()`, SELECT/UPDATE admin + leitura/escrita propria por `auth.uid() = customer_id OR email = auth user email`

#### `order_items`
- `id` uuid PK, `order_id` uuid FK->orders (CASCADE), `product_id` uuid FK->products (SET NULL)
- `product_name` text, `product_image` text, `price` numeric(10,2), `quantity` int, `variation` text, `created_at`
- RLS: INSERT publico, SELECT admin

#### `store_settings` (singleton, id=1)
- `id` int PK (default 1), `store_name` text (default '[NOME_DA_LOJA]'), `store_short_name` text (default '[NOME_CURTO]'), `store_tagline` text (default '[TAGLINE]'), `logo_url` text
- `primary_color` text (default '[COR_PRIMARIA]'), `announcement_text` text (default '[ANUNCIO_BARRA]'), `announcement_enabled` bool (default true)
- `whatsapp_number` text (default '[WHATSAPP]'), `whatsapp_message` text (default '[MSG_WHATSAPP]'), `email_contact` text (default '[E_MAIL_CONTATO]')
- `instagram_url` text (default '[INSTAGRAM_URL]'), `facebook_url` text (default '[FACEBOOK_URL]')
- `free_shipping_enabled` bool (default true), `free_shipping_threshold` numeric(10,2) (default [FRETE_GRATIS_THRESHOLD])
- `pix_discount_percent` numeric(5,2) (default [DESCONTO_PIX]), `max_installments` int (default [PARCELAS_MAX])
- `cnpj` text (default '[CNPJ]'), `footer_about` text (default '[TEXTO_RODAPE]'), `origin_cep` text (default '[CEP_ORIGEM]')
- `mp_access_token` text, `mp_public_key` text, `mp_environment` text (default 'sandbox'), `mp_enabled` bool (default false), `mp_client_id` text, `mp_client_secret` text
- `email_gateway_enabled` bool (default false), `email_provider` text (default 'resend'), `resend_api_key` text, `email_from_name` text, `email_from_address` text
- `updated_at`
- RLS: leitura publica, UPDATE/INSERT admin

#### `site_content` (chave-valor para textos editaveis)
- `key` text PK, `value` text, `category` text (default 'general'), `updated_at`
- Categorias: `home` (titulos de secao), `trust` (selos de confianca), `footer` (links e textos), `policy` (textos legais)
- Policias armazenadas em formato `Titulo|Texto||Titulo|Texto` (secoes separadas por `||`)
- RLS: leitura publica, CRUD admin
- Seed: selos de confianca = [SELOS_CONFIANCA] (separados por ;), titulos de secao, textos de rodape, e 4 politicas padrao (privacidade, trocas, entregas, termos) em portugues, referenciando LGPD e CDC

#### `shipping_carriers`
- `id` uuid PK, `name` text, `code` text UNIQUE, `provider` text (default 'manual')
- `api_key` text, `api_url` text, `environment` text (default 'production'), `services` text (codigos separados por virgula)
- `enabled` bool (default true), `sort_order` int, `extra_config` jsonb, `created_at`
- Providers suportados: `manual`, `correios`, `melhor_envio`, `superfrete`, `frenet`
- RLS: SELECT apenas authenticated (protege tokens), CRUD admin
- Seed: Correios PAC, Correios SEDEX (manual), SuperFrete (superfrete)

#### `ebooks`
- `id` uuid PK, `title` text, `slug` text UNIQUE, `description` text, `cover_url` text
- `price` numeric(10,2) (default 0), `hotmart_checkout_url` text, `author` text, `category` text
- `pages` int, `preview_url` text, `featured` bool, `active` bool, `sort_order` int, `created_at`
- RLS: leitura publica (active=true), CRUD admin

#### `ebook_modules`
- `id` uuid PK, `ebook_id` uuid FK->ebooks (CASCADE), `title` text, `description` text, `sort_order` int, `created_at`
- RLS: leitura publica, CRUD admin

#### `ebook_lessons`
- `id` uuid PK, `module_id` uuid FK->ebook_modules (CASCADE), `title` text
- `content_type` text CHECK IN ('video','pdf','text','embed'), `video_url` text, `pdf_url` text, `text_content` text, `embed_url` text
- `duration_minutes` int, `is_free_preview` bool (default false), `sort_order` int, `created_at`
- RLS: leitura publica, CRUD admin

#### `ebook_access`
- `id` uuid PK, `ebook_id` uuid FK->ebooks (CASCADE), `user_id` uuid FK->auth.users (CASCADE) DEFAULT auth.uid()
- `granted_by` text (default 'system'), `order_id` uuid FK->orders (SET NULL), `granted_at`, `expires_at` (nullable)
- UNIQUE(ebook_id, user_id)
- RLS: CRUD propria (auth.uid() = user_id), admin via service role

#### `ebook_lesson_progress`
- `id` uuid PK, `lesson_id` uuid FK->ebook_lessons (CASCADE), `user_id` uuid FK->auth.users (CASCADE) DEFAULT auth.uid()
- `completed` bool (default false), `last_position_seconds` int (default 0), `updated_at`
- UNIQUE(lesson_id, user_id)
- RLS: CRUD propria (auth.uid() = user_id)

#### `customer_favorites`
- `id` uuid PK, `user_id` uuid FK->auth.users (CASCADE) DEFAULT auth.uid(), `product_id` uuid FK->products (CASCADE), `created_at`
- UNIQUE(user_id, product_id)
- RLS: SELECT/INSERT/DELETE propria (auth.uid() = user_id), sem UPDATE

#### `customer_addresses`
- `id` uuid PK, `user_id` uuid FK->auth.users (CASCADE) DEFAULT auth.uid()
- `label` text (default 'Endereco'), `recipient_name` text, `cep` text, `address` text, `city` text, `state` text, `phone` text
- `is_default` bool (default false), `created_at`, `updated_at`
- RLS: CRUD propria (auth.uid() = user_id)

#### `customer_contacts`
- `id` uuid PK, `name` text, `email` text UNIQUE, `phone` text, `whatsapp_opt_in` bool (default false)
- `total_orders` int (default 0), `total_spent` numeric(10,2) (default 0), `last_order_date` timestamptz, `created_at`
- RLS: CRUD admin

#### `marketing_automations`
- `id` uuid PK, `name` text, `channel` text CHECK IN ('email','sms','whatsapp') (default 'email')
- `trigger_type` text CHECK IN ('order_status','new_offer','cart_recovery','welcome','custom') (default 'order_status')
- `trigger_config` jsonb (default '{}'), `message_template` text, `status` text CHECK IN ('active','paused','draft') (default 'active')
- `stats_sent` int (default 0), `stats_opened` int (default 0), `sort_order` int, `created_at`, `updated_at`
- RLS: CRUD admin
- Seed: 4 automacoes padrao (status do pedido, carrinho abandonado, nova oferta, boas-vindas)

#### `automation_runs`
- `id` uuid PK, `automation_id` uuid FK->marketing_automations (CASCADE), `trigger_type` text
- `recipient_email` text, `recipient_phone` text, `customer_name` text, `order_number` text
- `payload` jsonb (default '{}'), `status` text (default 'queued'), `error_message` text, `created_at`
- RLS: CRUD admin
- Trigger: `AFTER UPDATE ON orders` quando status muda -> insere run com trigger_type='order_status'

#### `ebook_launch_subscribers`
- `id` uuid PK, `email` text UNIQUE, `name` text, `user_id` uuid FK->auth.users (SET NULL), `phone` text
- `source` text CHECK IN ('site_signup','ebook_vitrine','manual') (default 'ebook_vitrine'), `created_at`
- RLS: INSERT/SELECT publica, UPDATE/DELETE propria (ou admin)

#### `ebook_launch_campaigns`
- `id` uuid PK, `ebook_id` uuid FK->ebooks (CASCADE), `subject` text, `message` text
- `channel` text CHECK IN ('email','whatsapp','sms') (default 'email'), `sent_count` int (default 0)
- `status` text CHECK IN ('draft','sent','scheduled') (default 'draft'), `created_by` text, `created_at`, `sent_at`
- RLS: CRUD admin

#### `dashboard_period` (singleton, id=1)
- `id` int PK (default 1, CHECK id=1), `period_start` timestamptz (default now())
- RLS: leitura publica, UPDATE admin

### Storage
- Bucket `product-images` (publico)
- Politicas: leitura publica anonima, upload/update/delete admin

### Funcoes SECURITY DEFINER (RPC)
- `create_order(p_payload jsonb) RETURNS orders` — cria pedido a partir de JSONB (safe insert para anon)
- `process_payment_return(p_order_number text, p_payment_status text) RETURNS TABLE(order_number, total, customer_name)` — processa retorno MP
- `set_order_notes(p_order_id uuid, p_notes text) RETURNS void` — grava preference ID do MP
- `get_my_orders(p_email text) RETURNS SETOF orders` — busca pedidos por e-mail (sem login)
- `get_my_order_items(p_order_id uuid, p_email text) RETURNS SETOF order_items` — itens de um pedido por e-mail
- `request_order_refund(p_order_id uuid, p_email text) RETURNS orders` — solicita cancelamento (CDC Art. 49)
- `trigger_order_status_automation() RETURNS TRIGGER` — insere automation_run em mudanca de status (EXECUTE revogado de PUBLIC/anon/authenticated)

---

## EDGE FUNCTIONS

### 1. `mp-checkout` (verify_jwt: false)
Cria preferencia de pagamento no Mercado Pago Checkout Pro.
- Recebe: `{ order_number, items[], total, shipping_cost, customer, back_url }`
- Busca `store_settings` (mp_access_token, mp_environment)
- Cria preferencia no `/checkout/preferences` da API MP
- Items: nome truncado 255 chars, unit_price
- Shipments: `mode: "not_specified"`, cost = shipping_cost (NUNCA como item separado)
- Payer: nome, email, phone (parsed), address (CEP, rua, cidade, estado)
- `external_reference` = order_number
- `notification_url` = URL do webhook `/functions/v1/mp-webhook`
- `auto_return: "approved"`
- `back_urls`: success -> `/pedido-confirmado`, pending -> `/pedido-confirmado`, failure -> `/pedido-confirmado`
- Retorna `{ init_point, preference_id, sandbox }` (sandbox usa sandbox init_point)
- Installments: min 1, max [PARCELAS_MAX], floor R$50 por parcela

### 2. `mp-webhook` (verify_jwt: false)
Recebe notificacoes de pagamento do Mercado Pago.
- Recebe `{ type: "payment", data: { id: paymentId } }`
- Ignora tipos nao relevantes (silencioso 200)
- Consulta pagamento na API MP (`/v1/payments/{id}`)
- Extrai `external_reference` (order_number) e busca pedido no Supabase
- **Pagamento aprovado**:
  - Atualiza `payment_status: "paid"`, `status: "processamento"`
  - Tenta compra automatica de etiqueta (Melhor Envio ou SuperFrete)
  - `tryBuyLabel()`: envia `orders: [order.id]` (UUID de 36 chars, NUNCA o order_number curto)
  - Melhor Envio: POST `/api/v2/me/shipment/print` com Bearer token
  - SuperFrete: POST `/v1/label` com Bearer token, service code
  - Sucesso: salva `tracking_code` + `label_url` + `status: "enviado"`
  - Falha: salva `manual_label_required: true` + `label_purchase_error` (NUNCA quebra o webhook)
  - Todo o bloco de etiqueta envolto em try/catch — erros nunca interrompem o comprovante
- **Pagamento rejeitado/cancelado**: `payment_status: "failed"`, `status: "recebido"`
- **Pending**: apenas registra `payment_status`
- CORS headers em todas as respostas (preflight, success, error)

### 3. `shipping-quote` (verify_jwt: false)
Cotacao de frete multi-transportadora com APIs reais e fallback local.
- Recebe: `{ cep, products[] }` (cada produto: weight_g, length_cm, width_cm, height_cm, declared_value, quantity)
- Agrega dimensoes (minimo 16cm por lado, minimo 300g)
- Busca transportadoras ativas em `shipping_carriers`
- Roda todas as cotacoes em paralelo (`Promise.allSettled`):
  - Melhor Envio: POST `/api/v2/me/shipment/calculate`
  - SuperFrete: POST `/v1/quote`
  - Frenet: POST `/api/ quoting`
- Fallback local: `estimateCost()` = peso + dimensao dimensional + valor + distancia (delta de prefixo de CEP)
- Ultimo recurso: PAC + SEDEX basico estimado
- Deduplica por nome+preco, ordena do mais barato
- Retorna `{ options: [{ name, days, price, carrier, gateway, service_id }], error }`

### 4. `send-launch-broadcast` (verify_jwt: true)
Dispara campanhas de lancamento de e-books por e-mail via Resend.
- Recebe: `{ campaignId }` + token de sessao do usuario
- Carrega campanha, subscribers, e configuracoes de e-mail
- Se gateway desabilitado: marca todos como "queued" com warning
- Se habilitado: loop pelos subscribers, POST para `api.resend.com/emails` com from/to/subject/text
- Registra cada envio em `automation_runs` (sent/failed/queued)
- Atualiza campanha para `status: "sent"` com `sent_count`
- WhatsApp/SMS: marca como queued (sem gateway implementado)
- Retorna `{ stats: { sent, failed, queued }, errors }`

---

## PAGINAS CUSTOMER-FACING (DETALHES)

### HomePage
- HeroBanner (carrossel de banners ativos, auto-rotate 5s, crossfade, dots + prev/next)
- Trust badges (4 selos: [SELOS_CONFIANCA] separados por ;) — textos editaveis em site_content
- Categorias (grid com icones, busca no Supabase)
- Destaques (produtos featured=true, ativos)
- Novidades (produtos ordenados por created_at desc, limit 8)
- E-books em destaque (featured=true, ativos)
- CTA banner (texto editavel, botao para /produtos)
- Todos os titulos de secao editaveis via `getText(key, fallback)`
- Nome da loja, tagline, e logo vindos de store_settings

### ProductsPage
- Sidebar de categorias (colapsavel no mobile)
- Filtros: categoria (URL param `cat`), busca (URL param `q`), ordenacao (relevancia, preco asc/desc, mais vendidos)
- Categoria especial `lancamentos`: ordena por created_at desc, limita 12
- Busca com `ilike` no nome do produto
- Grid responsivo (2/3/4 colunas)
- Loading skeletons, empty state
- ProductsCard para cada item

### ProductDetailPage
- Galeria de imagens com zoom + suporte a video (mp4/webm/YouTube embed)
- Variacoes de produto (tipo de variacao, valor, ajuste de preco)
- Seletor de quantidade com limite `max_per_customer`
- Calculadora de frete por CEP (chama edge function shipping-quote)
- Estrelas de avaliacao + reviews com fotos e videos
- Apenas compradores verificados podem avaliar (verifica order_items -> orders -> customer_id match)
- Reviews iniciam `approved: false` (moderacao admin)
- Um review por cliente por produto (CHECK no RLS)
- Produtos relacionados da mesma categoria
- Botao de favorito (requer login)
- Textos de cuidado/manutencao do produto (care_instructions) se aplicavel ao nicho

### CheckoutPage (3 passos)
1. **Dados do cliente**: nome, email, phone, CEP (com auto-preenchimento de endereco logado), endereco, cidade, estado
   - Calcula frete automaticamente ao digitar CEP
   - Progress bar de frete gratis (subtotal/threshold x 100)
   - Checkbox opt-in de marketing (LGPD) — obrigatorio para prosseguir
   - Pre-preenche e-mail e endereco padrao se cliente logado
2. **Pagamento**: se MP habilitado, mostra opcoes (cartao ate [PARCELAS_MAX]x, Pix com [DESCONTO_PIX]% desconto, boleto)
   - Chama edge function `mp-checkout` para criar preferencia
   - Redireciona para MP Checkout Pro `init_point`
   - Se MP falhar, pedido ja esta salvo — avisa o cliente
   - Se MP desabilitado, mostra mensagem de pagamento manual
3. **Confirmacao**: tela de pedido recebido
- Pedido criado via `create_order()` RPC (SECURITY DEFINER, safe insert)
- Order items salvos separadamente
- Shipping carrier/service/gateway salvos no pedido
- Numero do pedido: `[PREFIXO_PEDIDO]{YYYYMMDD}{4-digit random}`

### OrderReturnPage (retorno Mercado Pago)
- Le URL params: `status`, `order`, `payment_id`
- Chama `process_payment_return()` RPC para atualizar status
- **Sucesso**: limpa o carrinho (clearCart), mostra confirmacao verde
- **Pendente**: mostra aviso amarelo de processamento
- **Falha**: mostra aviso vermelho com botao "Tentar Novamente"
- Sempre mostra: numero do pedido, valor, proximos passos

### MyOrdersPage (sem login)
- Busca de pedidos por e-mail (qualquer pessoa, sem autenticacao)
- Usa `get_my_orders(p_email)` e `get_my_order_items(p_order_id, p_email)` (SECURITY DEFINER)
- Pipeline visual de status do pedido
- Botao de rastreio (Correios ou URL customizada)
- Janela de 7 dias para devolucao (CDC Art. 49) — botao "Solicitar Cancelamento/Devolucao"
- Usa `request_order_refund()` RPC

### CustomerLogin
- Login e cadastro com e-mail/senha (tabbed)
- Cadastro exige opt-in de marketing (LGPD)
- Senha minima 6 caracteres
- Apos signup, upsert em `ebook_launch_subscribers` (source: 'site_signup')
- Redireciona: cliente -> /minha-conta, admin -> /admin
- Login Google OAuth para admin (redirect para Supabase OAuth)

### MyAccountPage (cliente logado)
- Tabs: Visao Geral, Pedidos, Favoritos, Enderecos, Perfil
- Pedidos: historico com pipeline de status, rastreio, detalhes expansiveis
- Favoritos: grid de produtos favoritados
- Enderecos: CRUD com flag de padrao (limpa outros padroes ao definir um)
- Perfil: e-mail verificado, data de cadastro, estatisticas

### MemberAreaPage (cliente com acesso)
- Lista de cursos inscritos com barras de progresso
- Detalhe do curso: sidebar de modulos/licoes, player principal
- Player suporta: video (YouTube/Vimeo/MP4 com controlsList="nodownload"), PDF (inline + download), embed (iframe), texto
- Toggle de conclusao de licao (ebook_lesson_progress)
- Licoes de preview gratis marcadas
- Verificacao de acesso via `ebook_access` (user_id match + expires_at null ou futuro)

### EbooksPage
- CTA para area de membros (condicional se logado)
- E-books em destaque + todos os e-books
- Captura de leads (e-mail) -> upsert em `ebook_launch_subscribers`
- Aviso de transparencia Hotmart

### EbookDetailPage
- Capa, preco, descricao, paginas, features
- Deteccao de acesso: se tem acesso -> botao "Ir para o curso" (/area-de-membros)
- Se nao tem -> botao de checkout Hotmart (link externo, nova aba)
- Link de preview se disponivel

### PolicyPage
- 4 tipos: privacidade, trocas, entregas, termos
- Conteudo do DB (site_content, formato `Titulo|Texto||Titulo|Texto`)
- Fallback para conteudo padrao hardcoded se nao houver no DB
- Referencia LGPD (Lei 13.709/2018) e CDC (Lei 8.078/90)

---

## PAINEL ADMIN (todas as sub-paginas)

### AdminPanel (shell)
- Sidebar de navegacao com icones
- Secoes: Dashboard, Pedidos, Produtos, Categorias, Reviews, Banners, Frete, Pagamentos, E-books, Contatos, Automacoes, Conteudo, Configuracoes, Acesso
- Verificacao de admin (isAdmin = email == [ADMIN_EMAIL])

### AdminDashboard
- Faturamento por periodo (hoje/semana/mes/ano)
- Resumo de receita do periodo atual (dashboard_period)
- Contagem de pedidos por status
- Top 5 produtos mais vendidos
- Alerta de estoque baixo (≤[ESTOQUE_BAIXO_ALERTA] unidades)
- Download de relatorio CSV (BOM + semicolon-delimited para Excel)
- Zerar periodo (baixa CSV + atualiza dashboard_period.period_start)

### AdminOrders
- Visualizacao Kanban (drag-and-drop entre colunas de status) + Tabela
- Colunas: recebido, processamento, enviado, confirmado, entregue, cancelado
- Detalhe do pedido: cliente, endereco, itens, total
- Input de rastreio (salvar -> status automatico para "enviado")
- Link "Abrir etiqueta (PDF)" quando label_url disponivel
- Botao "Imprimir Etiqueta" (abre janela com HTML formatado)
- Badge "Emitir Manualmente" quando manual_label_required=true (com erro da transportadora)
- Export CSV com filtro de periodo

### AdminProducts
- Lista com busca, ordenacao, reordenacao (setas up/down)
- Form modal: nome, slug (auto-gerado), descricao, preco, compare_price, categoria, imagens (drag-and-drop upload), video
- Variacoes: tipo de variacao, valor, estoque, ajuste de preco (delete-all + reinsert no save)
- Especificacoes tecnicas (specs jsonb)
- Especificacoes de envio: peso, dimensoes, peso da embalagem, dimensoes da embalagem, valor declarado
- Badges (comma-separated array, opcoes pre-definidas: [BANDEIRAS_BADGES])
- Toggles: featured, active
- Campo care_instructions (texto de cuidados/manutencao — relevante para o nicho)

### AdminCategories
- CRUD de categorias com ordenacao
- Nome, slug (auto-gerado), icone (selecao de lista de icones lucide-react)
- Icone padrao: [ICONE_CATEGORIA_PADRAO]

### AdminReviews
- Abas: Pendentes, Aprovadas, Todas (com badge de contagem pendente)
- Aprovar/desaprovar/deletar
- Mostra fotos e videos do review, estrelas, nome do produto

### AdminBanners
- CRUD de banners da home (reordenar)
- Upload de imagem, titulo, subtitulo, CTA text, CTA link, toggle ativo

### AdminContent
- Tabs por categoria: home, trust, footer, policy
- Edicao inline (blur-save)
- Editor de politicas dedicado (secoes Titulo|Texto)
- Adicionar/deletar chaves de conteudo

### AdminShipping
- CRUD de transportadoras
- Toggle enable/disable, reordenar
- Provider: manual, correios, melhor_envio, superfrete, frenet
- API key/token (campo password), URL custom, ambiente (sandbox/production), codigos de servico
- Manual = calculo local (sem API)

### AdminPayments
- Configuracao Mercado Pago
- Toggle habilitar, ambiente sandbox/production
- Access token, public key, client ID/secret (opcional)
- Instrucoes de setup, metodos de pagamento aceitos

### AdminSettings
- Identidade: logo upload, nome, nome curto, tagline, CNPJ, texto do rodape
- Barra de anuncio (toggle + texto)
- Cor primaria (color picker)
- Contato: WhatsApp (numero + mensagem), e-mail, Instagram, Facebook
- Frete: CEP de origem, threshold de frete gratis, toggle frete gratis
- Pagamento: desconto Pix %, maximo de parcelas
- E-mail: toggle gateway, provider (Resend), API key, from name, from address

### AdminEbooks
- Grid de e-books com cover, preco, toggles featured/active
- CRUD: titulo, descricao, cover URL, preco, Hotmart checkout URL, autor, categoria, paginas, preview URL
- Links para sub-modulos: Course Builder, Access Manager, Launch Broadcast

### AdminCourseBuilder
- CRUD de modulos (titulo, descricao, ordem)
- CRUD de licoes (titulo, content_type, URL/content, duracao, free preview, ordem)
- Tipos: video, pdf, embed, text
- Hierarquia: modulos -> licoes, expansivel

### AdminAccessManager
- Conceder/revogar acesso a e-books
- Busca por e-mail (profiles + auth.admin.listUsers)
- Define dias de expiracao
- Lista de acessos com status (ativo/expirado)
- Estatisticas

### AdminLaunchBroadcast
- Lista de subscribers
- Historico de campanhas
- Compor: assunto, mensagem, canal (e-mail/WhatsApp/SMS)
- Dispara via edge function `send-launch-broadcast`
- Estatisticas de envio (sent/failed/queued)

### AdminAutomations
- Lista de automacoes de marketing
- Canal (email/whatsapp/sms), trigger (order_status/new_offer/cart_recovery/welcome/custom)
- Toggle ativar/pausar
- Visualizacao do fluxo (trigger -> channel -> message)
- Log de execucoes recentes (automation_runs)

### AdminContacts
- Tabela de contatos compilada de pedidos
- Nome, e-mail, telefone, opt-in, total de pedidos, total gasto, ultimo pedido
- Busca, filtro de opt-in
- Export CSV, export WhatsApp opt-in (.txt de numeros)
- Upsert em customer_contacts

---

## AUTENTICACAO

- **Admin**: e-mail/senha via Supabase Auth. Admin determinado por e-mail hardcoded ([ADMIN_EMAIL]). Tambem suporta Google OAuth (redirect para Supabase OAuth, volta para /admin)
- **Cliente**: e-mail/senha via Supabase Auth. `isCustomer` = logado E nao e admin. Email confirmation OFF
- **onAuthStateChange**: wrapped em IIFE async para evitar deadlock
- **Session**: persistSession: true, autoRefreshToken: true
- **Signup**: upsert em ebook_launch_subscribers, exige marketing_opt_in

---

## CARRINHO (CartContext)

- Estado em React + persistencia em localStorage (chave: `[NOME_CURTO]-cart` minisculo sem espacos)
- Items: product_id, product_name, product_slug, product_image, price, quantity, variation, max_per_customer, stock
- Operacoes: addItem (merge duplicatas, cap em stock), removeItem, updateQuantity (respeita max_per_customer e stock), clearCart
- Subtotal e totalItems computados
- Shipping option e customer CEP persistidos para continuidade do checkout
- Swallow de erros de localStorage (modo privado)
- Cart drawer: slide-out, lista de items, calculadora de frete por CEP, progress bar de frete gratis, subtotal + total, botao checkout

---

## FLUXO DE PAGAMENTO COMPLETO

1. Cliente preenche dados no checkout -> CEP dispara calculo de frete
2. Cliente marca opt-in de marketing (LGPD, obrigatorio)
3. Pedido criado via `create_order()` RPC -> salva order + order_items
4. Se MP habilitado: chama edge function `mp-checkout` -> cria preferencia
5. Redireciona para MP Checkout Pro `init_point`
6. Cliente paga no MP -> MP envia webhook para `mp-webhook`
7. Webhook consulta pagamento na API MP -> atualiza pedido
8. Se aprovado: status -> "processamento", tenta comprar etiqueta
9. Compra de etiqueta: envia UUID do pedido (NUNCA order_number) para Melhor Envio/SuperFrete
10. Sucesso: salva tracking_code + label_url, status -> "enviado"
11. Falha: marca manual_label_required, NUNCA quebra o webhook
12. Cliente retorna para `/pedido-confirmado?status=success&order=[PREFIXO_PEDIDO]...`
13. OrderReturnPage chama `process_payment_return()`, limpa carrinho, mostra confirmacao

---

## CONFORMIDADE LEGAL (LGPD + CDC)

- Opt-in de marketing no checkout e no cadastro (LGPD Art. 8)
- Checkbox de opt-in obrigatorio para prosseguir no checkout
- Politicas de privacidade, trocas, entregas e termos editaveis no painel
- Referencia a LGPD (Lei 13.709/2018) e CDC (Lei 8.078/90)
- Direito de acessar, corrigir, excluir dados (mencionado na politica)
- 7 dias para devolucao (CDC Art. 49) — botao na area de meus pedidos
- Cookies essenciais apenas (mencionado na politica)
- Dados nao compartilhados com terceiros exceto transportadoras e obrigacao legal
- Aviso de transparencia Hotmart no footer
- Subscriber pode remover proprio e-mail da lista de lancamento
- Reviews restritas a compradores verificados

---

## CONFIGURACOES EDITAVEIS (tudo pelo painel, sem codigo)

- Nome, logo, tagline, CNPJ da loja
- Texto do rodape, barra de anuncio (toggle + texto)
- Cor primaria
- WhatsApp (numero + mensagem padrao)
- E-mail de contato, Instagram, Facebook
- CEP de origem (para cotacao de frete)
- Threshold de frete gratis + toggle
- Desconto Pix (%), maximo de parcelas
- Credenciais Mercado Pago (access token, public key, ambiente, client ID/secret)
- Gateway de e-mail (toggle, Resend API key, from name/address)
- Transportadoras (nome, provider, API key, URL, ambiente, codigos de servico, enable/disable)
- Categorias de produtos (CRUD)
- Banners da home (CRUD)
- Todos os textos do site (titulos de secao, selos de confianca, links do rodape)
- Politicas legais (privacidade, trocas, entregas, termos)
- E-books e cursos (CRUD + modulos/licoes)
- Acessos de e-book (conceder/revogar)
- Automacoes de marketing (criar/pausar/ativar)

---

## TYPESCRIPT TYPES (resumo)

Todas as interfaces em `src/types/index.ts`:
- `Product`, `ProductVariation`, `Category`, `ProductReview`, `Banner`
- `Order`, `OrderItem`, `OrderStatus` (recebido|processamento|enviado|confirmado|entregue|cancelado)
- `ORDER_STATUS_LABELS`, `ORDER_STATUS_COLORS`, `ORDER_PIPELINE`
- `StoreSettings`, `ShippingCarrier`, `SiteContent`
- `Ebook`, `EbookModule`, `EbookLesson`, `EbookAccess`, `EbookLessonProgress`
- `EbookLaunchSubscriber`, `EbookLaunchCampaign`
- `MarketingAutomation`, `AutomationChannel`, `AutomationTrigger`, `AutomationStatus`
- `CustomerContact`, `CustomerFavorite`, `CustomerAddress`
- `CartItem`, `LessonContentType` (video|pdf|text|embed)
- `ShippingQuoteOption`, `ShippingQuoteRequest`

---

## VERCEL.JSON

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## INSTRUCOES DE GERACAO

Gere este projeto completo com TODAS as funcionalidades descritas acima funcionais e prontas para producao. Cada pagina, componente, migracao, edge function, tipo, e configuracao deve ser implementada por completo — sem placeholders, sem "TODO", sem meios-termos. O site deve sair funcionando de ponta a ponta: o cliente navega, adiciona ao carrinho, calcula frete, faz checkout, paga no Mercado Pago, recebe confirmacao, rastreia o pedido; o admin gerencia tudo pelo painel; o sistema compra etiquetas automaticamente e envia notificacoes. Use Supabase para todo persistence. Use apenas as dependencias listadas (React, TypeScript, Vite, Tailwind, lucide-react, @supabase/supabase-js). Siga exatamente a paleta de cores, tipografia, e estetica descrita na secao CONFIGURACAO. Implemente todas as migrations SQL, todas as edge functions com CORS, todos os RLS policies, e todas as funcoes SECURITY DEFINER. O resultado deve ser um projeto que, ao ser deployado, funciona completamente sem necessidade de nenhuma configuracao adicional de codigo. Substitua todas as variaveis [ENTRE_COLCHETES] pelos valores preenchidos na secao CONFIGURACAO. O idioma da interface e portugues brasileiro (pt-BR) e a moeda e Real (BRL).
