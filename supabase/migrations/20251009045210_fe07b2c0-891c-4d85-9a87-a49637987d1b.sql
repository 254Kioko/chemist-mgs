-- Create medicines table
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all medicines"
  ON public.medicines
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert medicines"
  ON public.medicines
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update medicines"
  ON public.medicines
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete medicines"
  ON public.medicines
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Cashiers can view and update quantity only
CREATE POLICY "Cashiers can view all medicines"
  ON public.medicines
  FOR SELECT
  USING (has_role(auth.uid(), 'cashier'::app_role));

CREATE POLICY "Cashiers can update medicine quantity"
  ON public.medicines
  FOR UPDATE
  USING (has_role(auth.uid(), 'cashier'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();