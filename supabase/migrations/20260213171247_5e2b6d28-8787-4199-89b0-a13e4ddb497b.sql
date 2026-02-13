
-- 1. App role enum and user_roles table (for admin access)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can read user_roles
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Order messages table
CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'team')),
  sender_email text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read messages on their own orders
CREATE POLICY "Customers read own order messages"
  ON public.order_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_messages.order_id
        AND orders.customer_email = (auth.jwt()->>'email')
    )
  );

-- Customers can insert messages on their own orders
CREATE POLICY "Customers send messages on own orders"
  ON public.order_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'customer'
    AND sender_email = (auth.jwt()->>'email')
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_messages.order_id
        AND orders.customer_email = (auth.jwt()->>'email')
    )
  );

-- Admins can read all messages
CREATE POLICY "Admins read all messages"
  ON public.order_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert messages
CREATE POLICY "Admins send messages"
  ON public.order_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND sender_type = 'team'
  );

-- 3. Quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  description text,
  valid_until date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Customers can read quotes on their own orders
CREATE POLICY "Customers read own quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = quotes.order_id
        AND orders.customer_email = (auth.jwt()->>'email')
    )
  );

-- Admins full access on quotes
CREATE POLICY "Admins manage quotes"
  ON public.quotes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Update orders RLS: let customers read their own orders
CREATE POLICY "Customers read own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (customer_email = (auth.jwt()->>'email'));

-- Admins can read all orders
CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update orders (status changes etc.)
CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Update order_files RLS: let customers read their own files
CREATE POLICY "Customers read own order files"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
        AND orders.customer_email = (auth.jwt()->>'email')
    )
  );

-- Admins can read all order files
CREATE POLICY "Admins read all order files"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger for quotes updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable realtime on order_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
