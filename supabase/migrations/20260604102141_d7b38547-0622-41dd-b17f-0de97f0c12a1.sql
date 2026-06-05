ALTER TABLE public.inventory_items ALTER COLUMN stock SET DEFAULT 5;
ALTER TABLE public.inventory_items ALTER COLUMN threshold SET DEFAULT 3;
UPDATE public.inventory_items SET threshold = 3 WHERE threshold <> 3;

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  vid UUID; cur INT; iname TEXT;
BEGIN
  IF NEW.base_id IS NOT NULL THEN
    SELECT stock, name INTO cur, iname FROM public.inventory_items WHERE id = NEW.base_id FOR UPDATE;
    IF cur - NEW.quantity < 3 THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', iname; END IF;
    UPDATE public.inventory_items SET stock = stock - NEW.quantity WHERE id = NEW.base_id;
  END IF;
  IF NEW.sauce_id IS NOT NULL THEN
    SELECT stock, name INTO cur, iname FROM public.inventory_items WHERE id = NEW.sauce_id FOR UPDATE;
    IF cur - NEW.quantity < 3 THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', iname; END IF;
    UPDATE public.inventory_items SET stock = stock - NEW.quantity WHERE id = NEW.sauce_id;
  END IF;
  IF NEW.cheese_id IS NOT NULL THEN
    SELECT stock, name INTO cur, iname FROM public.inventory_items WHERE id = NEW.cheese_id FOR UPDATE;
    IF cur - NEW.quantity < 3 THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', iname; END IF;
    UPDATE public.inventory_items SET stock = stock - NEW.quantity WHERE id = NEW.cheese_id;
  END IF;
  IF NEW.veggie_ids IS NOT NULL THEN
    FOREACH vid IN ARRAY NEW.veggie_ids LOOP
      SELECT stock, name INTO cur, iname FROM public.inventory_items WHERE id = vid FOR UPDATE;
      IF cur - NEW.quantity < 3 THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', iname; END IF;
      UPDATE public.inventory_items SET stock = stock - NEW.quantity WHERE id = vid;
    END LOOP;
  END IF;
  IF NEW.meat_ids IS NOT NULL THEN
    FOREACH vid IN ARRAY NEW.meat_ids LOOP
      SELECT stock, name INTO cur, iname FROM public.inventory_items WHERE id = vid FOR UPDATE;
      IF cur - NEW.quantity < 3 THEN RAISE EXCEPTION 'OUT_OF_STOCK:%', iname; END IF;
      UPDATE public.inventory_items SET stock = stock - NEW.quantity WHERE id = vid;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'delivered') THEN
    ALTER TYPE public.order_status ADD VALUE 'delivered';
  END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS archived_for_admin BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'inventory_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  END IF;
END $$;