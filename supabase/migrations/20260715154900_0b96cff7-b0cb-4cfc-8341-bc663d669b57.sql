
CREATE TABLE public.pix_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  product TEXT NOT NULL,
  customer_name TEXT,
  customer_cpf TEXT,
  utm TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  pix_code TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pix_transactions_transaction_id ON public.pix_transactions(transaction_id);
CREATE INDEX idx_pix_transactions_status ON public.pix_transactions(status);

GRANT ALL ON public.pix_transactions TO service_role;

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

-- No public policies: only service_role (server routes) can access.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pix_transactions_updated_at
BEFORE UPDATE ON public.pix_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
