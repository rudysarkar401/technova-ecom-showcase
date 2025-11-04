-- Create role-based access control system

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create analytics view function for admins
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE(
  total_users BIGINT,
  total_interactions BIGINT,
  total_views BIGINT,
  total_cart_adds BIGINT,
  total_purchases BIGINT,
  popular_categories JSONB,
  recent_interactions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM user_interactions) as total_users,
    (SELECT COUNT(*) FROM user_interactions) as total_interactions,
    (SELECT COUNT(*) FROM user_interactions WHERE interaction_type = 'view') as total_views,
    (SELECT COUNT(*) FROM user_interactions WHERE interaction_type = 'cart_add') as total_cart_adds,
    (SELECT COUNT(*) FROM user_interactions WHERE interaction_type = 'purchase') as total_purchases,
    (SELECT jsonb_agg(jsonb_build_object('category', category, 'count', count))
     FROM (
       SELECT category, COUNT(*) as count
       FROM user_interactions
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC
       LIMIT 10
     ) as categories) as popular_categories,
    (SELECT jsonb_agg(jsonb_build_object(
       'user_id', user_id,
       'product_id', product_id,
       'interaction_type', interaction_type,
       'category', category,
       'created_at', created_at
     ))
     FROM (
       SELECT user_id, product_id, interaction_type, category, created_at
       FROM user_interactions
       ORDER BY created_at DESC
       LIMIT 50
     ) as recent) as recent_interactions;
END;
$$;