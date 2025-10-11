-- Drop existing cashier view policies for sales
DROP POLICY IF EXISTS "Cashiers can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Cashiers can view their sale items" ON public.sale_items;

-- Create new policies allowing cashiers to view all sales
CREATE POLICY "Cashiers can view all sales"
ON public.sales
FOR SELECT
USING (has_role(auth.uid(), 'cashier'::app_role));

CREATE POLICY "Cashiers can view all sale items"
ON public.sale_items
FOR SELECT
USING (has_role(auth.uid(), 'cashier'::app_role));