-- Enable pg_net extension for calling edge functions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a settings table to store admin contact information
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_phone TEXT NOT NULL,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify settings
CREATE POLICY "Admins can view admin settings"
ON public.admin_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check low stock and send alert
CREATE OR REPLACE FUNCTION public.check_low_stock_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_phone_number TEXT;
  stock_threshold INTEGER;
BEGIN
  -- Get admin settings
  SELECT admin_phone, low_stock_threshold 
  INTO admin_phone_number, stock_threshold
  FROM public.admin_settings 
  LIMIT 1;

  -- If admin phone is configured and quantity is below threshold
  IF admin_phone_number IS NOT NULL AND NEW.quantity < COALESCE(stock_threshold, 10) AND (TG_OP = 'INSERT' OR OLD.quantity >= COALESCE(stock_threshold, 10)) THEN
    -- Call the edge function using pg_net
    PERFORM extensions.net.http_post(
      url := 'https://mrkklnawbmgvbmklmkou.supabase.co/functions/v1/send-low-stock-alert',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'medicineName', NEW.name,
        'quantity', NEW.quantity,
        'adminPhone', admin_phone_number
      )
    );
    
    RAISE LOG 'Low stock alert triggered for % (quantity: %)', NEW.name, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on medicines table
DROP TRIGGER IF EXISTS trigger_low_stock_alert ON public.medicines;

CREATE TRIGGER trigger_low_stock_alert
AFTER INSERT OR UPDATE OF quantity
ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock_and_alert();