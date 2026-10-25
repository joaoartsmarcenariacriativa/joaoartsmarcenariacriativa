# PROMPT COMPLETO — Loja E-commerce Artesanal Completa com Painel Admin, E-books, Pagamentos e Logística

## OBJETIVO

Criar uma loja e-commerce completa e pronta para produção de produtos artesanais em madeira (marcenaria criativa), com catálogo de produtos físicos, e-books/infoprodutos com área de membros, checkout com Mercado Pago, cálculo de frete multi-transportadora com APIs reais, painel administrativo completo (dashboard, produtos, pedidos Kanban, frete, pagamentos, e-books, cursos, contatos, automações, conteúdo, reviews, banners, configurações), contas de cliente com favoritos e endereços, notificações de status de pedido, e conformidade total com a LGPD e o CDC brasileiro. Tudo 100% editável pelo painel admin, sem necessidade de mexer no código.

---

## STACK TECNOLÓGICO

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS 3
- **Ícones**: lucide-react
- **Backend/Banco de dados**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Cliente Supabase**: @supabase/supabase-js (singleton com proxy lazy-init, persistSession: true, autoRefreshToken: true)
- **Pagamentos**: Mercado Pago Checkout Pro (redirect flow)
- **Frete**: Melhor Envio, SuperFrete, Frenet (APIs reais) + estimativa local de fallback
- **E-mail transacional/marketing**: Resend (gateway de e-mail, gratuito até 3.000/mês)
- **E-books checkout**: Hotmart (link externo de checkout)
- **Hospedagem**: Vercel (SPA rewrite: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`)

---

## DESIGN E IDENTIDADE VISUAL

### Paleta de cores (Tailwind custom)
```js
colors: {
  espresso: { DEFAULT: '#2A2018', tint: '#3A2E24', deep: '#1A130E' },  // marcoscuro — texto principal, fundos escuros
  wood:      { DEFAULT: '#8B6F47', light: '#A88A5E', dark: '#6B5436' }, // madeira — CTAs, links, destaques
  clay:      { DEFAULT: '#B8916A', light: '#CDAE88' },                  // argila — detalhes
  moss:      { DEFAULT: '#6B7B4F', light: '#8A9B6E' },                  // musgo — sucesso, confirmações
  cream:     '#F8F5EF',   // fundo principal
  paper:     '#FFFFFF',   // cards
  muted:     '#756B61',   // texto secundário
  rim:       '#DBD0C2',   // bordas
}
```

### Tipografia
- **Serif**: Fraunces (títulos, números de destaque)
- **Sans**: Inter (corpo de texto, UI)
- Line-height: 150% body, 120% headings
- Máximo 3 pesos de fonte

### Sombras
- `soft`: `0 2px 8px rgba(42,32,24,0.06)` — cards sutis
- `card`: `0 4px 16px rgba(42,32,24,0.08)` — cards elevados
- `lift`: `0 8px 30px rgba(42,32,24,0.12)` — modais, drawers

### Princípios de design
- Estética rústica-artesanal premium: tons quentes de madeira, cream, espresso
- Espaçamento base 8px
- Hover states com transições suaves (transition-colors, transition-transform)
- Micro-interações: scale-105 em botões, hover:border-wood em cards
- Design responsivo: mobile-first, breakpoints sm/md/lg
- Scrollbar customizada (rim/wood)
- Selection color: wood bg + cream text
- Nunca usar roxo/índigo/violeta

---

## ESTRUTURA DE ROTAS (SPA sem react-router, pushState manual)

| Rota | Página | Acesso |
|---|---|---|
| `/` | HomePage (hero, categorias, destaques, novidades, e-books, CTA) | Público |
| `/produtos` | ProductsPage (filtros por categoria, busca, ordenação) | Público |
| `/produto/:slug` | ProductDetailPage (galeria, variações, frete, reviews, relacionados) | Público |
| `/ebooks` | EbooksPage (vitrine de e-books, captura de leads) | Público |
| `/ebook/:slug` | EbookDetailPage (detalhe, link Hotmart, detecção de acesso) | Público |
| `/checkout` | CheckoutPage (3 passos: dados → pagamento → confirmação) | Público |
| `/pedido-confirmado` | OrderReturnPage (retorno MP, limpa carrinho) | Público |
| `/meus-pedidos` | MyOrdersPage (busca de pedido por e-mail, sem login) | Público |
| `/politica/:tipo` | PolicyPage (privacidade, trocas, entregas, termos) | Público |
| `/entrar` | CustomerLogin (login/cadastro de cliente) | Público |
| `/minha-conta` | MyAccountPage (dashboard do cliente: pedidos, favoritos, endereços, perfil) | Cliente logado |
| `/area-de-membros` | MemberAreaPage (player de cursos: vídeo, PDF, texto, embed) | Cliente com acesso |
| `/admin/login` | AdminLogin (e-mail/senha ou Google OAuth) | Público |
| `/admin` | AdminPanel (shell com sidebar e sub-páginas) | Admin logado |

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
    Footer.tsx                     # Store info, social, navegação, políticas, Hotmart notice
    CartDrawer.tsx                  # Drawer lateral, cálculo de frete CEP, progress bar frete grátis
    HeroBanner.tsx                  # Carrossel de banners (auto-rotate 5s, crossfade)
    ProductCard.tsx                 # Card de produto (badges, rating, preço, parcelas, favorito)
    SearchBar.tsx                   # Busca com autocomplete debounced (250ms, min 2 chars)
    FavoriteButton.tsx              # Toggle favorito (requer login de cliente)
    ImageUploader.tsx               # Upload drag-and-drop para Supabase Storage (imagens + vídeos)
    ErrorBoundary.tsx               # Error boundary com fallback UI
  hooks/
    useFavorites.ts                 # Hook de favoritos (load, toggle, optimistic UI)
  lib/
    supabase.ts                     # Cliente Supabase singleton (lazy proxy)
    shipping.ts                     # Wrapper para edge function de cotação de frete
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
  config.toml                       # Config de edge functions (verify_jwt por função)
  functions/
    mp-checkout/index.ts            # Cria preferência MP Checkout Pro
    mp-webhook/index.ts             # Recebe notificações MP, atualiza pedido, compra etiqueta
    shipping-quote/index.ts         # Cotação multi-transportadora (APIs + fallback local)
    send-launch-broadcast/index.ts  # Dispara campanhas de e-mail via Resend
  migrations/
    [27+ migrações SQL]
vercel.json                         # SPA rewrite
```

---

## ESQUEMA DO BANCO DE DADOS (Supabase/PostgreSQL)

### Tabelas principais

#### `categories`
- `id` uuid PK, `name` text, `slug` text UNIQUE, `icon` text (nome do ícone lucide), `sort_order` int, `created_at`
- RLS: leitura pública, CRUD admin

#### `products`
- `id` uuid PK, `name` text, `slug` text UNIQUE, `description` text, `specs` jsonb, `care_instructions` text
- `price` numeric(10,2), `compare_price` numeric(10,2), `category_id` uuid FK→categories
- `images` text[], `video_url` text, `stock` int, `production_days` int (default 7), `max_per_customer` int (default 10)
- `rating` numeric(2,1) (default 5.0), `review_count` int (default 0), `sales_count` int (default 0)
- `badges` text[], `featured` bool, `sort_order` int, `active` bool, `created_at`
- **Especs de frete**: `ship_weight_g` int, `ship_length_cm` numeric(10,1), `ship_width_cm` numeric(10,1), `ship_height_cm` numeric(10,1), `ship_packaging_weight_g` int (default 0), `ship_packaging_cm` int (default 0), `ship_declared_value` numeric(12,2) (nullable = usa price)
- RLS: leitura pública (active=true), CRUD admin

#### `product_variations`
- `id` uuid PK, `product_id` uuid FK→products (CASCADE), `wood_type` text, `dimensions` text, `finish` text, `stock` int, `price_adjustment` numeric(10,2), `created_at`
- RLS: leitura pública, CRUD admin

#### `product_reviews`
- `id` uuid PK, `product_id` uuid FK→products (CASCADE), `customer_name` text, `rating` int (CHECK 1-5), `comment` text
- `photos` text[], `videos` text[] (ambos default '{}')
- `approved` bool (default false), `created_at`
- `customer_id` uuid (nullable), `order_id` uuid (nullable)
- RLS: leitura pública apenas aprovadas (OU próprias reviews), INSERT apenas por compradores autenticados que compraram o produto e não reviewaram ainda, UPDATE/DELETE admin
- Índice: `(customer_id, product_id)`

#### `banners`
- `id` uuid PK, `title` text, `subtitle` text, `image_url` text, `cta_text` text, `cta_link` text, `sort_order` int, `active` bool, `created_at`
- RLS: leitura pública, CRUD admin

#### `orders`
- `id` uuid PK, `order_number` text UNIQUE, `customer_name` text, `email` text, `phone` text
- `cep` text, `address` text, `city` text, `state` text
- `total` numeric(10,2), `shipping_cost` numeric(10,2) (default 0)
- `status` text (default 'recebido'), `payment_method` text, `payment_status` text (default 'pending')
- `tracking_code` text, `label_url` text (PDF da etiqueta), `notes` text
- `delivered_at` timestamptz, `customer_id` uuid FK→auth.users (SET NULL), `marketing_opt_in` bool (default false)
- `manual_label_required` bool (default false), `label_purchase_error` text
- `shipping_carrier_name` text, `shipping_service_name` text, `shipping_gateway` text ('melhorenvio'|'superfrete'), `shipping_service_id` text
- `created_at`, `updated_at`
- Statuses: `recebido`, `processamento`, `enviado`, `confirmado`, `entregue`, `cancelado`
- RLS: INSERT via função SECURITY DEFINER `create_order()`, SELECT/UPDATE admin + leitura/escrita própria por `auth.uid() = customer_id OR email = auth user email`

#### `order_items`
- `id` uuid PK, `order_id` uuid FK→orders (CASCADE), `product_id` uuid FK→products (SET NULL)
- `product_name` text, `product_image` text, `price` numeric(10,2), `quantity` int, `variation` text, `created_at`
- RLS: INSERT público, SELECT admin

#### `store_settings` (singleton, id=1)
- `id` int PK (default 1), `store_name` text, `store_short_name` text, `store_tagline` text, `logo_url` text
- `primary_color` text (default '#b45309'), `announcement_text` text, `announcement_enabled` bool (default true)
- `whatsapp_number` text, `whatsapp_message` text, `email_contact` text
- `instagram_url` text, `facebook_url` text
- `free_shipping_enabled` bool, `free_shipping_threshold` numeric(10,2) (default 200)
- `pix_discount_percent` numeric(5,2) (default 5), `max_installments` int (default 12)
- `cnpj` text, `footer_about` text, `origin_cep` text
- `mp_access_token` text, `mp_public_key` text, `mp_environment` text (default 'sandbox'), `mp_enabled` bool (default false), `mp_client_id` text, `mp_client_secret` text
- `email_gateway_enabled` bool (default false), `email_provider` text (default 'resend'), `resend_api_key` text, `email_from_name` text, `email_from_address` text
- `updated_at`
- RLS: leitura pública, UPDATE/INSERT admin

#### `site_content` (chave-valor para textos editáveis)
- `key` text PK, `value` text, `category` text (default 'general'), `updated_at`
- Categorias: `home` (títulos de seção), `trust` (selos de confiança), `footer` (links e textos), `policy` (textos legais)
- Políticas armazenadas em formato `Título|Texto||Título|Texto` (seções separadas por `||`)
- RLS: leitura pública, CRUD admin

#### `shipping_carriers`
- `id` uuid PK, `name` text, `code` text UNIQUE, `provider` text (default 'manual')
- `api_key` text, `api_url` text, `environment` text (default 'production'), `services` text (códigos separados por vírgula)
- `enabled` bool (default true), `sort_order` int, `extra_config` jsonb, `created_at`
- Providers suportados: `manual`, `correios`, `melhor_envio`, `superfrete`, `frenet`
- RLS: SELECT apenas authenticated (protege tokens), CRUD admin
- Seed: Correios PAC, Correios SEDEX (manual), SuperFrete (superfrete)

#### `ebooks`
- `id` uuid PK, `title` text, `slug` text UNIQUE, `description` text, `cover_url` text
- `price` numeric(10,2) (default 0), `hotmart_checkout_url` text, `author` text, `category` text
- `pages` int, `preview_url` text, `featured` bool, `active` bool, `sort_order` int, `created_at`
- RLS: leitura pública (active=true), CRUD admin

#### `ebook_modules`
- `id` uuid PK, `ebook_id` uuid FK→ebooks (CASCADE), `title` text, `description` text, `sort_order` int, `created_at`
- RLS: leitura pública, CRUD admin

#### `ebook_lessons`
- `id` uuid PK, `module_id` uuid FK→ebook_modules (CASCADE), `title` text
- `content_type` text CHECK IN ('video','pdf','text','embed'), `video_url` text, `pdf_url` text, `text_content` text, `embed_url` text
- `duration_minutes` int, `is_free_preview` bool (default false), `sort_order` int, `created_at`
- RLS: leitura pública, CRUD admin

#### `ebook_access`
- `id` uuid PK, `ebook_id` uuid FK→ebooks (CASCADE), `user_id` uuid FK→auth.users (CASCADE) DEFAULT auth.uid()
- `granted_by` text (default 'system'), `order_id` uuid FK→orders (SET NULL), `granted_at`, `expires_at` (nullable)
- UNIQUE(ebook_id, user_id) — um acesso por usuário por e-book
- RLS: CRUD própria (auth.uid() = user_id), admin via service role

#### `ebook_lesson_progress`
- `id` uuid PK, `lesson_id` uuid FK→ebook_lessons (CASCADE), `user_id` uuid FK→auth.users (CASCADE) DEFAULT auth.uid()
- `completed` bool (default false), `last_position_seconds` int (default 0), `updated_at`
- UNIQUE(lesson_id, user_id)
- RLS: CRUD própria (auth.uid() = user_id)

#### `customer_favorites`
- `id` uuid PK, `user_id` uuid FK→auth.users (CASCADE) DEFAULT auth.uid(), `product_id` uuid FK→products (CASCADE), `created_at`
- UNIQUE(user_id, product_id)
- RLS: SELECT/INSERT/DELETE própria (auth.uid() = user_id), sem UPDATE

#### `customer_addresses`
- `id` uuid PK, `user_id` uuid FK→auth.users (CASCADE) DEFAULT auth.uid()
- `label` text (default 'Endereço'), `recipient_name` text, `cep` text, `address` text, `city` text, `state` text, `phone` text
- `is_default` bool (default false), `created_at`, `updated_at`
- RLS: CRUD própria (auth.uid() = user_id)

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
- Seed: 4 automações padrão (status do pedido, carrinho abandonado, nova oferta, boas-vindas)

#### `automation_runs`
- `id` uuid PK, `automation_id` uuid FK→marketing_automations (CASCADE), `trigger_type` text
- `recipient_email` text, `recipient_phone` text, `customer_name` text, `order_number` text
- `payload` jsonb (default '{}'), `status` text (default 'queued'), `error_message` text, `created_at`
- RLS: CRUD admin
- Trigger: `AFTER UPDATE ON orders` quando status muda → insere run com trigger_type='order_status'

#### `ebook_launch_subscribers`
- `id` uuid PK, `email` text UNIQUE, `name` text, `user_id` uuid FK→auth.users (SET NULL), `phone` text
- `source` text CHECK IN ('site_signup','ebook_vitrine','manual') (default 'ebook_vitrine'), `created_at`
- RLS: INSERT/SELECT pública, UPDATE/DELETE própria (ou admin)

#### `ebook_launch_campaigns`
- `id` uuid PK, `ebook_id` uuid FK→ebooks (CASCADE), `subject` text, `message` text
- `channel` text CHECK IN ('email','whatsapp','sms') (default 'email'), `sent_count` int (default 0)
- `status` text CHECK IN ('draft','sent','scheduled') (default 'draft'), `created_by` text, `created_at`, `sent_at`
- RLS: CRUD admin

#### `dashboard_period` (singleton, id=1)
- `id` int PK (default 1, CHECK id=1), `period_start` timestamptz (default now())
- RLS: leitura pública, UPDATE admin

### Storage
- Bucket `product-images` (público)
- Políticas: leitura pública anônima, upload/update/delete admin

### Funções SECURITY DEFINER (RPC)
- `create_order(p_payload jsonb) RETURNS orders` — cria pedido a partir de JSONB (safe insert para anon)
- `process_payment_return(p_order_number text, p_payment_status text) RETURNS TABLE(order_number, total, customer_name)` — processa retorno MP
- `set_order_notes(p_order_id uuid, p_notes text) RETURNS void` — grava preference ID do MP
- `get_my_orders(p_email text) RETURNS SETOF orders` — busca pedidos por e-mail (sem login)
- `get_my_order_items(p_order_id uuid, p_email text) RETURNS SETOF order_items` — itens de um pedido por e-mail
- `request_order_refund(p_order_id uuid, p_email text) RETURNS orders` — solicita cancelamento (CDC Art. 49)
- `trigger_order_status_automation() RETURNS TRIGGER` — insere automation_run em mudança de status (EXECUTE revogado de PUBLIC/anon/authenticated)

---

## EDGE FUNCTIONS

### 1. `mp-checkout` (verify_jwt: false)
Cria preferência de pagamento no Mercado Pago Checkout Pro.
- Recebe: `{ order_number, items[], total, shipping_cost, customer, back_url }`
- Busca `store_settings` (mp_access_token, mp_environment)
- Cria preferência no `/checkout/preferences` da API MP
- Items: nome truncado 255 chars, unit_price
- Shipments: `mode: "not_specified"`, cost = shipping_cost (NUNCA como item separado)
- Payer: nome, email, phone (parsed), address (CEP, rua, cidade, estado)
- `external_reference` = order_number
- `notification_url` = URL do webhook `/functions/v1/mp-webhook`
- `auto_return: "approved"`
- `back_urls`: success → `/pedido-confirmado`, pending → `/pedido-confirmado`, failure → `/pedido-confirmado`
- Retorna `{ init_point, preference_id, sandbox }` (sandbox usa sandbox init_point)
- Installments: min 1, max 12, floor R$50 por parcela

### 2. `mp-webhook` (verify_jwt: false)
Recebe notificações de pagamento do Mercado Pago.
- Recebe `{ type: "payment", data: { id: paymentId } }`
- Ignora tipos não relevantes (silencioso 200)
- Consulta pagamento na API MP (`/v1/payments/{id}`)
- Extrai `external_reference` (order_number) e busca pedido no Supabase
- **Pagamento aprovado**:
  - Atualiza `payment_status: "paid"`, `status: "processamento"`
  - Tenta compra automática de etiqueta (Melhor Envio ou SuperFrete)
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
Cotação de frete multi-transportadora com APIs reais e fallback local.
- Recebe: `{ cep, products[] }` (cada produto: weight_g, length_cm, width_cm, height_cm, declared_value, quantity)
- Agrega dimensões (mínimo 16cm por lado, mínimo 300g)
- Busca transportadoras ativas em `shipping_carriers`
- Roda todas as cotações em paralelo (`Promise.allSettled`):
  - Melhor Envio: POST `/api/v2/me/shipment/calculate`
  - SuperFrete: POST `/v1/quote`
  - Frenet: POST `/api/ quoting`
- Fallback local: `estimateCost()` = peso + dimensão dimensional + valor + distância (delta de prefixo de CEP)
- Último recurso: PAC + SEDEX básico estimado
- Deduplica por nome+preço, ordena do mais barato
- Retorna `{ options: [{ name, days, price, carrier, gateway, service_id }], error }`

### 4. `send-launch-broadcast` (verify_jwt: true)
Dispara campanhas de lançamento de e-books por e-mail via Resend.
- Recebe: `{ campaignId }` + token de sessão do usuário
- Carrega campanha, subscribers, e configurações de e-mail
- Se gateway desabilitado: marca todos como "queued" com warning
- Se habilitado: loop pelos subscribers, POST para `api.resend.com/emails` com from/to/subject/text
- Registra cada envio em `automation_runs` (sent/failed/queued)
- Atualiza campanha para `status: "sent"` com `sent_count`
- WhatsApp/SMS: marca como queued (sem gateway implementado)
- Retorna `{ stats: { sent, failed, queued }, errors }`

---

## PÁGINAS CUSTOMER-FACING (DETALHES)

### HomePage
- HeroBanner (carrossel de banners ativos, auto-rotate 5s, crossfade, dots + prev/next)
- Trust badges (4 selos: Feito à Mão, Garantia de Fábrica, Entrega Segura, Madeira Sustentável) — textos editáveis em site_content
- Categorias (grid com ícones, busca no Supabase)
- Destaques (produtos featured=true, ativos)
- Novidades (produtos ordenados por created_at desc, limit 8)
- E-books em destaque (featured=true, ativos)
- CTA banner (texto editável, botão para /produtos)
- Todos os títulos de seção editáveis via `getText(key, fallback)`

### ProductsPage
- Sidebar de categorias (colapsável no mobile)
- Filtros: categoria (URL param `cat`), busca (URL param `q`), ordenação (relevância, preço asc/desc, mais vendidos)
- Categoria especial `lancamentos`: ordena por created_at desc, limita 12
- Busca com `ilike` no nome do produto
- Grid responsivo (2/3/4 colunas)
- Loading skeletons, empty state
- ProductsCard para cada item

### ProductDetailPage
- Galeria de imagens com zoom + suporte a vídeo (mp4/webm/YouTube embed)
- Variações de produto (tipo de madeira, dimensões, acabamento com ajuste de preço)
- Seletor de quantidade com limite `max_per_customer`
- Calculadora de frete por CEP (chama edge function shipping-quote)
- Estrelas de avaliação + reviews com fotos e vídeos
- Apenas compradores verificados podem avaliar (verifica order_items → orders → customer_id match)
- Reviews iniciam `approved: false` (moderação admin)
- Um review por cliente por produto (CHECK no RLS)
- Produtos relacionados da mesma categoria
- Botão de favorito (requer login)

### CheckoutPage (3 passos)
1. **Dados do cliente**: nome, email, phone, CEP (com auto-preenchimento de endereço logado), endereço, cidade, estado
   - Calcula frete automaticamente ao digitar CEP
   - Progress bar de frete grátis (subtotal/threshold × 100)
   - Checkbox opt-in de marketing (LGPD) — obrigatório para prosseguir
   - Pré-preenche e-mail e endereço padrão se cliente logado
2. **Pagamento**: se MP habilitado, mostra opções (cartão até 12x, Pix com desconto, boleto)
   - Chama edge function `mp-checkout` para criar preferência
   - Redireciona para MP Checkout Pro `init_point`
   - Se MP falhar, pedido já está salvo — avisa o cliente
   - Se MP desabilitado, mostra mensagem de pagamento manual
3. **Confirmação**: tela de pedido recebido
- Pedido criado via `create_order()` RPC (SECURITY DEFINER, safe insert)
- Order items salvos separadamente
- Shipping carrier/service/gateway salvos no pedido
- Número do pedido: `JA{YYYYMMDD}{4-digit random}`

### OrderReturnPage (retorno Mercado Pago)
- Lê URL params: `status`, `order`, `payment_id`
- Chama `process_payment_return()` RPC para atualizar status
- **Sucesso**: limpa o carrinho (clearCart), mostra confirmação verde
- **Pendente**: mostra aviso amarelo de processamento
- **Falha**: mostra aviso vermelho com botão "Tentar Novamente"
- Sempre mostra: número do pedido, valor, próximos passos

### MyOrdersPage (sem login)
- Busca de pedidos por e-mail (qualquer pessoa, sem autenticação)
- Usa `get_my_orders(p_email)` e `get_my_order_items(p_order_id, p_email)` (SECURITY DEFINER)
- Pipeline visual de status do pedido
- Botão de rastreio (Correios ou URL customizada)
- Janela de 7 dias para devolução (CDC Art. 49) — botão "Solicitar Cancelamento/Devolução"
- Usa `request_order_refund()` RPC

### CustomerLogin
- Login e cadastro com e-mail/senha (tabbed)
- Cadastro exige opt-in de marketing (LGPD)
- Senha mínima 6 caracteres
- Após signup, upsert em `ebook_launch_subscribers` (source: 'site_signup')
- Redireciona: cliente → /minha-conta, admin → /admin
- Login Google OAuth para admin (redirect para Supabase OAuth)

### MyAccountPage (cliente logado)
- Tabs: Visão Geral, Pedidos, Favoritos, Endereços, Perfil
- Pedidos: histórico com pipeline de status, rastreio, detalhes expansíveis
- Favoritos: grid de produtos favoritados
- Endereços: CRUD com flag de padrão (limpa outros padrões ao definir um)
- Perfil: e-mail verificado, data de cadastro, estatísticas

### MemberAreaPage (cliente com acesso)
- Lista de cursos inscritos com barras de progresso
- Detalhe do curso: sidebar de módulos/lições, player principal
- Player suporta: vídeo (YouTube/Vimeo/MP4 com controlsList="nodownload"), PDF (inline + download), embed (iframe), texto
- Toggle de conclusão de lição (ebook_lesson_progress)
- Lições de preview grátis marcadas
- Verificação de acesso via `ebook_access` (user_id match + expires_at null ou futuro)

### EbooksPage
- CTA para área de membros (condicional se logado)
- E-books em destaque + todos os e-books
- Captura de leads (e-mail) → upsert em `ebook_launch_subscribers`
- Aviso de transparência Hotmart

### EbookDetailPage
- Capa, preço, descrição, páginas, features
- Detecção de acesso: se tem acesso → botão "Ir para o curso" (/area-de-membros)
- Se não tem → botão de checkout Hotmart (link externo, nova aba)
- Link de preview se disponível

### PolicyPage
- 4 tipos: privacidade, trocas, entregas, termos
- Conteúdo do DB (site_content, formato `Título|Texto||Título|Texto`)
- Fallback para conteúdo padrão hardcoded se não houver no DB
- Referencia LGPD (Lei 13.709/2018) e CDC (Lei 8.078/90)

---

## PAINEL ADMIN (todas as sub-páginas)

### AdminPanel (shell)
- Sidebar de navegação com ícones
- Seções: Dashboard, Pedidos, Produtos, Categorias, Reviews, Banners, Frete, Pagamentos, E-books, Contatos, Automações, Conteúdo, Configurações, Acesso
- Verificação de admin (isAdmin = email == ADMIN_EMAIL hardcoded)

### AdminDashboard
- Faturamento por período (hoje/semana/mês/ano)
- Resumo de receita do período atual (dashboard_period)
- Contagem de pedidos por status
- Top 5 produtos mais vendidos
- Alerta de estoque baixo (≤5 unidades)
- Download de relatório CSV (BOM + semicolon-delimited para Excel)
- Zerar período (baixa CSV + atualiza dashboard_period.period_start)

### AdminOrders
- Visualização Kanban (drag-and-drop entre colunas de status) + Tabela
- Colunas: recebido, processamento, enviado, confirmado, entregue, cancelado
- Detalhe do pedido: cliente, endereço, itens, total
- Input de rastreio (salvar → status automático para "enviado")
- Link "Abrir etiqueta (PDF)" quando label_url disponível
- Botão "Imprimir Etiqueta" (abre janela com HTML formatado)
- Badge "Emitir Manualmente" quando manual_label_required=true (com erro da transportadora)
- Export CSV com filtro de período

### AdminProducts
- Lista com busca, ordenação, reordenação (setas up/down)
- Form modal: nome, slug (auto-gerado), descrição, preço, compare_price, categoria, imagens (drag-and-drop upload), vídeo
- Variações: tipo de madeira, dimensões, acabamento, estoque, ajuste de preço (delete-all + reinsert no save)
- Especificações técnicas (specs jsonb)
- Especificações de envio: peso, dimensões, peso da embalagem, dimensões da embalagem, valor declarado
- Badges (comma-separated array)
- Toggles: featured, active

### AdminCategories
- CRUD de categorias com ordenação
- Nome, slug (auto-gerado), ícone (seleção de lista: Utensils, Home, Bird, Baby, TreePine, Sparkles, Hammer, Heart, Gift, Leaf, Flower, Sun)

### AdminReviews
- Abas: Pendentes, Aprovadas, Todas (com badge de contagem pendente)
- Aprovar/desaprovar/deletar
- Mostra fotos e vídeos do review, estrelas, nome do produto

### AdminBanners
- CRUD de banners da home (reordenar)
- Upload de imagem, título, subtítulo, CTA text, CTA link, toggle ativo

### AdminContent
- Tabs por categoria: home, trust, footer, policy
- Edição inline (blur-save)
- Editor de políticas dedicado (seções Título|Texto)
- Adicionar/deletar chaves de conteúdo

### AdminShipping
- CRUD de transportadoras
- Toggle enable/disable, reordenar
- Provider: manual, correios, melhor_envio, superfrete, frenet
- API key/token (campo password), URL custom, ambiente (sandbox/production), códigos de serviço
- Manual = cálculo local (sem API)

### AdminPayments
- Configuração Mercado Pago
- Toggle habilitar, ambiente sandbox/production
- Access token, public key, client ID/secret (opcional)
- Instruções de setup, métodos de pagamento aceitos

### AdminSettings
- Identidade: logo upload, nome, nome curto, tagline, CNPJ, texto do rodapé
- Barra de anúncio (toggle + texto)
- Cor primária (color picker)
- Contato: WhatsApp (número + mensagem), e-mail, Instagram, Facebook
- Frete: CEP de origem, threshold de frete grátis, toggle frete grátis
- Pagamento: desconto Pix %, máximo de parcelas
- E-mail: toggle gateway, provider (Resend), API key, from name, from address

### AdminEbooks
- Grid de e-books com cover, preço, toggles featured/active
- CRUD: título, descrição, cover URL, preço, Hotmart checkout URL, autor, categoria, páginas, preview URL
- Links para sub-módulos: Course Builder, Access Manager, Launch Broadcast

### AdminCourseBuilder
- CRUD de módulos (título, descrição, ordem)
- CRUD de lições (título, content_type, URL/content, duração, free preview, ordem)
- Tipos: video, pdf, embed, text
- Hierarquia: módulos → lições, expandível

### AdminAccessManager
- Conceder/revogar acesso a e-books
- Busca por e-mail (profiles + auth.admin.listUsers)
- Define dias de expiração
- Lista de acessos com status (ativo/expirado)
- Estatísticas

### AdminLaunchBroadcast
- Lista de subscribers
- Histórico de campanhas
- Compor: assunto, mensagem, canal (e-mail/WhatsApp/SMS)
- Dispara via edge function `send-launch-broadcast`
- Estatísticas de envio (sent/failed/queued)

### AdminAutomations
- Lista de automações de marketing
- Canal (email/whatsapp/sms), trigger (order_status/new_offer/cart_recovery/welcome/custom)
- Toggle ativar/pausar
- Visualização do fluxo (trigger → channel → message)
- Log de execuções recentes (automation_runs)

### AdminContacts
- Tabela de contatos compilada de pedidos
- Nome, e-mail, telefone, opt-in, total de pedidos, total gasto, último pedido
- Busca, filtro de opt-in
- Export CSV, export WhatsApp opt-in (.txt de números)
- Upsert em customer_contacts

---

## AUTENTICAÇÃO

- **Admin**: e-mail/senha via Supabase Auth. Admin determinado por e-mail hardcoded (`ADMIN_EMAIL`). Também suporta Google OAuth (redirect para Supabase OAuth, volta para /admin)
- **Cliente**: e-mail/senha via Supabase Auth. `isCustomer` = logado E não é admin. Email confirmation OFF
- **onAuthStateChange**: wrapped em IIFE async para evitar deadlock
- **Session**: persistSession: true, autoRefreshToken: true
- **Signup**: upsert em ebook_launch_subscribers, exige marketing_opt_in

---

## CARRINHO (CartContext)

- Estado em React + persistência em localStorage (`joao-arts-cart`)
- Items: product_id, product_name, product_slug, product_image, price, quantity, variation, max_per_customer, stock
- Operações: addItem (merge duplicatas, cap em stock), removeItem, updateQuantity (respeita max_per_customer e stock), clearCart
- Subtotal e totalItems computados
- Shipping option e customer CEP persistidos para continuidade do checkout
- Swallow de erros de localStorage (modo privado)
- Cart drawer: slide-out, lista de items, calculadora de frete por CEP, progress bar de frete grátis, subtotal + total, botão checkout

---

## FLUXO DE PAGAMENTO COMPLETO

1. Cliente preenche dados no checkout → CEP dispara cálculo de frete
2. Cliente marca opt-in de marketing (LGPD, obrigatório)
3. Pedido criado via `create_order()` RPC → salva order + order_items
4. Se MP habilitado: chama edge function `mp-checkout` → cria preferência
5. Redireciona para MP Checkout Pro `init_point`
6. Cliente paga no MP → MP envia webhook para `mp-webhook`
7. Webhook consulta pagamento na API MP → atualiza pedido
8. Se aprovado: status → "processamento", tenta comprar etiqueta
9. Compra de etiqueta: envia UUID do pedido (NUNCA order_number) para Melhor Envio/SuperFrete
10. Sucesso: salva tracking_code + label_url, status → "enviado"
11. Falha: marca manual_label_required, NUNCA quebra o webhook
12. Cliente retorna para `/pedido-confirmado?status=success&order=JA...`
13. OrderReturnPage chama `process_payment_return()`, limpa carrinho, mostra confirmação

---

## CONFORMIDADE LEGAL (LGPD + CDC)

- Opt-in de marketing no checkout e no cadastro (LGPD Art. 8)
- Checkbox de opt-in obrigatório para prosseguir no checkout
- Políticas de privacidade, trocas, entregas e termos editáveis no painel
- Referência à LGPD (Lei 13.709/2018) e CDC (Lei 8.078/90)
- Direito de acessar, corrigir, excluir dados (mencionado na política)
- 7 dias para devolução (CDC Art. 49) — botão na área de meus pedidos
- Cookies essenciais apenas (mencionado na política)
- Dados não compartilhados com terceiros exceto transportadoras e obrigação legal
- Aviso de transparência Hotmart no footer
- Subscriber pode remover próprio e-mail da lista de lançamento
- Reviews restritas a compradores verificados

---

## CONFIGURAÇÕES EDITÁVEIS (tudo pelo painel, sem código)

- Nome, logo, tagline, CNPJ da loja
- Texto do rodapé, barra de anúncio (toggle + texto)
- Cor primária
- WhatsApp (número + mensagem padrão)
- E-mail de contato, Instagram, Facebook
- CEP de origem (para cotação de frete)
- Threshold de frete grátis + toggle
- Desconto Pix (%), máximo de parcelas
- Credenciais Mercado Pago (access token, public key, ambiente, client ID/secret)
- Gateway de e-mail (toggle, Resend API key, from name/address)
- Transportadoras (nome, provider, API key, URL, ambiente, códigos de serviço, enable/disable)
- Categorias de produtos (CRUD)
- Banners da home (CRUD)
- Todos os textos do site (títulos de seção, selos de confiança, links do rodapé)
- Políticas legais (privacidade, trocas, entregas, termos)
- E-books e cursos (CRUD + módulos/lições)
- Acessos de e-book (conceder/revogar)
- Automações de marketing (criar/pausar/ativar)

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

## INSTRUÇÕES DE GERAÇÃO

Gere este projeto completo com TODAS as funcionalidades descritas acima funcionais e prontas para produção. Cada página, componente, migração, edge function, tipo, e configuração deve ser implementada por completo — sem placeholders, sem "TODO", sem meios-termos. O site deve sair funcionando de ponta a ponta: o cliente navega, adiciona ao carrinho, calcula frete, faz checkout, paga no Mercado Pago, recebe confirmação, rastreia o pedido; o admin gerencia tudo pelo painel; o sistema compra etiquetas automaticamente e envia notificações. Use Supabase para todo persistence. Use apenas as dependências listadas (React, TypeScript, Vite, Tailwind, lucide-react, @supabase/supabase-js). Siga exatamente a paleta de cores, tipografia, e estética rústica-artesanal descrita. Implemente todas as migrations SQL, todas as edge functions com CORS, todos os RLS policies, e todas as funções SECURITY DEFINER. O resultado deve ser um projeto que, ao ser deployado, funciona completamente sem necessidade de nenhuma configuração adicional de código.
