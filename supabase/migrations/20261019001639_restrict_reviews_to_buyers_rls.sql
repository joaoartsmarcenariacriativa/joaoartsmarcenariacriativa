-- Substitui a policy de insert que era permissive demais (anon inseria livremente)
-- por uma que exige que o cliente autenticado tenha um pedido com este produto.
DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;

CREATE POLICY "customer_insert_own_review_after_purchase"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = product_reviews.product_id
        AND o.customer_id = auth.uid()
        AND o.status IN ('recebido', 'processamento', 'enviado', 'confirmado', 'entregue')
    )
    AND NOT EXISTS (
      SELECT 1 FROM product_reviews pr
      WHERE pr.product_id = product_reviews.product_id
        AND pr.customer_id = auth.uid()
    )
  );

-- Permite ao cliente ler as próprias avaliações (mesmo não aprovadas).
DROP POLICY IF EXISTS "customer_read_own_reviews" ON product_reviews;
CREATE POLICY "customer_read_own_reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (approved = true OR customer_id = auth.uid());
