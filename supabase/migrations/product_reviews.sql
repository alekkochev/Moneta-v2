-- Табела за рецензии на производи
-- Се користи од modeli/*.html (рецензија под секој производ)

CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_slug TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Индекс за брзо читање по производ
CREATE INDEX IF NOT EXISTS idx_product_reviews_slug ON product_reviews (product_slug, created_at DESC);

-- RLS: дозволи анонимно читање + вметнување
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Анонимно читање" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Анонимно вметнување" ON product_reviews FOR INSERT WITH CHECK (true);
