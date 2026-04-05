
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'alumni', 'admin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- 4. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  roll_no TEXT DEFAULT '',
  department TEXT DEFAULT '',
  company TEXT DEFAULT '',
  package NUMERIC DEFAULT 0,
  batch TEXT DEFAULT '',
  job_role TEXT DEFAULT '',
  expertise TEXT[] DEFAULT '{}',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create job_referrals table
CREATE TABLE public.job_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Internship', 'Full-time', 'Part-time')),
  description TEXT DEFAULT '',
  requirements TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_referrals ENABLE ROW LEVEL SECURITY;

-- 6. Create mentorship_requests table
CREATE TABLE public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alumni_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- 7. Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_referrals_updated_at BEFORE UPDATE ON public.job_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON public.mentorship_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. RLS policies for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. RLS policies for profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 11. RLS policies for job_referrals
CREATE POLICY "Anyone authenticated can view open jobs" ON public.job_referrals
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Alumni can create jobs" ON public.job_referrals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'alumni') AND posted_by = auth.uid());

CREATE POLICY "Alumni can update own jobs" ON public.job_referrals
  FOR UPDATE TO authenticated
  USING (posted_by = auth.uid());

CREATE POLICY "Alumni can delete own jobs" ON public.job_referrals
  FOR DELETE TO authenticated
  USING (posted_by = auth.uid());

CREATE POLICY "Admins can manage all jobs" ON public.job_referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS policies for mentorship_requests
CREATE POLICY "Students can view own requests" ON public.mentorship_requests
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Alumni can view requests to them" ON public.mentorship_requests
  FOR SELECT TO authenticated
  USING (alumni_id = auth.uid());

CREATE POLICY "Admins can view all requests" ON public.mentorship_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create requests" ON public.mentorship_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'student')
    AND student_id = auth.uid()
    AND alumni_id <> auth.uid()
  );

CREATE POLICY "Alumni can update request status" ON public.mentorship_requests
  FOR UPDATE TO authenticated
  USING (alumni_id = auth.uid());

CREATE POLICY "Admins can manage all requests" ON public.mentorship_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
