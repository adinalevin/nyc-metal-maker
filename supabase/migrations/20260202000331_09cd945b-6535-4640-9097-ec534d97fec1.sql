-- Add order_code column with auto-generated human-friendly code
ALTER TABLE public.orders ADD COLUMN order_code text;

-- Create function to generate order code
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
  prefix text;
  seq_num integer;
  new_code text;
BEGIN
  -- Prefix based on request type: E for Estimate, R for Reorder
  IF NEW.request_type = 'Estimate' THEN
    prefix := 'E';
  ELSE
    prefix := 'R';
  END IF;
  
  -- Get count of orders for this year to generate sequence
  SELECT COUNT(*) + 1 INTO seq_num 
  FROM orders 
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: E-25-0001 (type-year-sequence)
  new_code := prefix || '-' || TO_CHAR(NOW(), 'YY') || '-' || LPAD(seq_num::text, 4, '0');
  
  NEW.order_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate order_code on insert
CREATE TRIGGER generate_order_code_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_code();