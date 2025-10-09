-- Insert user roles for admin and cashier
INSERT INTO public.user_roles (user_id, role) VALUES
  ('b0d67f09-7cee-4b83-9cad-32c650820c4d', 'admin'),
  ('7b51d71e-2bcf-4d8d-b896-d371cbe458fe', 'cashier')
ON CONFLICT (user_id, role) DO NOTHING;