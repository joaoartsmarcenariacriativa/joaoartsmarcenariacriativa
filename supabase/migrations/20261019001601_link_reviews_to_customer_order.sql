-- Vincula avaliações ao cliente e ao pedido que originou o direito de avaliar.
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS order_id uuid;

-- Índice para consulta rápida: este cliente já avaliou este produto?
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_product
  ON product_reviews(customer_id, product_id);
