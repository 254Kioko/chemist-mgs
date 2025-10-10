-- Fix search_path for generate_sale_number function
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM public.sales WHERE DATE(created_at) = CURRENT_DATE;
  new_number := 'SALE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Fix search_path for set_sale_number function
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$;