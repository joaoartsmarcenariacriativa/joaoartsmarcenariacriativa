export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specs: ProductSpec[];
  care_instructions: string | null;
  price: number;
  compare_price: number | null;
  category_id: string | null;
  images: string[];
  video_url: string | null;
  stock: number;
  production_days: number;
  max_per_customer: number | null;
  rating: number;
  review_count: number;
  sales_count: number;
  badges: string[];
  featured: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  ship_weight_g: number | null;
  ship_length_cm: number | null;
  ship_width_cm: number | null;
  ship_height_cm: number | null;
  ship_packaging_weight_g: number | null;
  ship_packaging_cm: number | null;
  ship_declared_value: number | null;
  category?: Category | null;
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  wood_type: string | null;
  dimensions: string | null;
  finish: string | null;
  stock: number;
  price_adjustment: number;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  photos: string[];
  videos: string[];
  approved: boolean;
  created_at: string;
  customer_id: string | null;
  order_id: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
  active: boolean;
}

export type CouponDiscountType = 'percent' | 'fixed';
export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string;
  active: boolean;
  description: string | null;
  created_at: string;
}

export type GatewayStatus = 'ativo' | 'teste';
export interface PaymentGateway {
  id: string;
  provider_name: string;
  public_key: string | null;
  status: GatewayStatus;
  enabled: boolean;
  created_at: string;
}

export interface PartnerStore {
  id: string;
  name: string;
  url: string;
  description: string | null;
  logo_url: string | null;
  category: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  slug: string | null;
  checkout_test_url: string | null;
  admin_email: string | null;
}

export type PartnerRole = 'admin' | 'manager';

export interface PartnerAccount {
  id: string;
  partner_store_id: string;
  user_id: string;
  role: PartnerRole;
  created_at: string;
}

export interface PartnerShowcaseItem {
  id: string;
  partner_store_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  price_label: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface PartnerAuditLog {
  id: string;
  partner_store_id: string;
  actor_email: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  variation: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  city: string | null;
  state: string | null;
  total: number;
  shipping_cost: number;
  status: OrderStatus;
  payment_method: string | null;
  payment_status: string | null;
  tracking_code: string | null;
  label_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  customer_id: string | null;
  marketing_opt_in: boolean;
  manual_label_required: boolean;
  shipping_carrier_name: string | null;
  shipping_service_name: string | null;
  shipping_gateway: string | null;
  shipping_service_id: string | null;
  label_purchase_error: string | null;
  order_items?: OrderItem[];
}

export type OrderStatus =
  | 'recebido'
  | 'processamento'
  | 'enviado'
  | 'confirmado'
  | 'entregue'
  | 'cancelado';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recebido: 'Pedido Recebido',
  processamento: 'Em Processamento',
  enviado: 'Pedido Enviado',
  confirmado: 'Pedido Confirmado',
  entregue: 'Pedido Entregue',
  cancelado: 'Cancelado/Reembolsado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  recebido: 'bg-wood/10 text-wood border-wood/30',
  processamento: 'bg-blue-100 text-blue-800 border-blue-200',
  enviado: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmado: 'bg-teal-100 text-teal-800 border-teal-200',
  entregue: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

export const ORDER_PIPELINE: OrderStatus[] = [
  'recebido',
  'processamento',
  'enviado',
  'confirmado',
  'entregue',
];

export interface Ebook {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string;
  price: number;
  hotmart_checkout_url: string;
  author: string | null;
  category: string | null;
  pages: number | null;
  preview_url: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface EbookModule {
  id: string;
  ebook_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  lessons?: EbookLesson[];
}

export interface EbookLaunchSubscriber {
  id: string;
  email: string;
  name: string | null;
  user_id: string | null;
  phone: string | null;
  source: string;
  created_at: string;
}

export interface EbookLaunchCampaign {
  id: string;
  ebook_id: string;
  subject: string;
  message: string;
  channel: 'email' | 'whatsapp' | 'sms';
  sent_count: number;
  status: 'draft' | 'sent' | 'scheduled';
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
}

export type LessonContentType = 'video' | 'pdf' | 'text' | 'embed';

export interface EbookLesson {
  id: string;
  module_id: string;
  title: string;
  content_type: LessonContentType;
  video_url: string | null;
  pdf_url: string | null;
  text_content: string | null;
  embed_url: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  sort_order: number;
  created_at: string;
}

export interface EbookAccess {
  id: string;
  ebook_id: string;
  user_id: string;
  granted_by: string | null;
  order_id: string | null;
  granted_at: string;
  expires_at: string | null;
}

export interface EbookLessonProgress {
  id: string;
  lesson_id: string;
  user_id: string;
  completed: boolean;
  last_position_seconds: number;
  updated_at: string;
}

export type AutomationChannel = 'email' | 'sms' | 'whatsapp';
export type AutomationTrigger = 'order_status' | 'new_offer' | 'cart_recovery' | 'welcome' | 'custom';
export type AutomationStatus = 'active' | 'paused' | 'draft';

export interface MarketingAutomation {
  id: string;
  name: string;
  channel: AutomationChannel;
  trigger_type: AutomationTrigger;
  trigger_config: Record<string, unknown>;
  message_template: string | null;
  status: AutomationStatus;
  stats_sent: number;
  stats_opened: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_opt_in: boolean;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  created_at: string;
}

export interface CustomerFavorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product | null;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  cep: string;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  price: number;
  quantity: number;
  variation: string | null;
  max_per_customer: number | null;
  stock: number;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  store_short_name: string;
  store_tagline: string;
  logo_url: string | null;
  primary_color: string;
  announcement_text: string;
  announcement_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
  email_contact: string;
  instagram_url: string | null;
  facebook_url: string | null;
  free_shipping_enabled: boolean;
  free_shipping_threshold: number;
  pix_discount_percent: number;
  max_installments: number;
  cnpj: string | null;
  footer_about: string;
  origin_cep: string | null;
  mp_access_token: string | null;
  mp_public_key: string | null;
  mp_environment: string;
  mp_enabled: boolean;
  mp_client_id: string | null;
  mp_client_secret: string | null;
  email_gateway_enabled: boolean;
  email_provider: string;
  resend_api_key: string | null;
  email_from_name: string | null;
  email_from_address: string | null;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  provider: string;
  api_key: string | null;
  api_url: string | null;
  environment: string;
  services: string | null;
  enabled: boolean;
  sort_order: number;
  extra_config: Record<string, unknown>;
  created_at: string;
}

export interface SiteContent {
  key: string;
  value: string;
  category: string;
}

export interface ShippingQuoteOption {
  name: string;
  days: number;
  price: number;
  carrier?: string;
  gateway?: 'melhorenvio' | 'superfrete' | 'manual';
  service_id?: string;
}

export interface ShippingQuoteRequest {
  cep: string;
  products: Array<{
    weight_g: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    declared_value: number;
    quantity: number;
  }>;
}
