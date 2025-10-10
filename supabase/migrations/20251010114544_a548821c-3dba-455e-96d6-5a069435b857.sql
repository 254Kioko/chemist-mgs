-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales
CREATE POLICY "Admins can view all sales"
ON public.sales FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cashiers can view their own sales"
ON public.sales FOR SELECT
USING (has_role(auth.uid(), 'cashier'::app_role) AND cashier_id = auth.uid());

CREATE POLICY "Cashiers can insert sales"
ON public.sales FOR INSERT
WITH CHECK (has_role(auth.uid(), 'cashier'::app_role) AND cashier_id = auth.uid());

CREATE POLICY "Admins can insert sales"
ON public.sales FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sale_items
CREATE POLICY "Admins can view all sale items"
ON public.sale_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cashiers can view their sale items"
ON public.sale_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sale_items.sale_id
    AND sales.cashier_id = auth.uid()
  )
);

CREATE POLICY "Cashiers can insert sale items"
ON public.sale_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sale_items.sale_id
    AND sales.cashier_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert sale items"
ON public.sale_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_sales_cashier_id ON public.sales(cashier_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_medicine_id ON public.sale_items(medicine_id);

-- Trigger for updating sales updated_at
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM public.sales WHERE DATE(created_at) = CURRENT_DATE;
  new_number := 'SALE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate sale number
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_sale
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION set_sale_number();

-- Enable realtime for sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;