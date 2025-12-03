-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table for user-defined focus tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'hsl(200, 80%, 55%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Add user_id to cycle_records
ALTER TABLE public.cycle_records 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to pomodoro_settings
ALTER TABLE public.pomodoro_settings 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create cycle_tags junction table for multiple tags per cycle
CREATE TABLE public.cycle_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.cycle_records(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(cycle_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies on cycle_records
DROP POLICY IF EXISTS "Allow public insert cycle_records" ON public.cycle_records;
DROP POLICY IF EXISTS "Allow public read cycle_records" ON public.cycle_records;

-- Drop existing public policies on pomodoro_settings
DROP POLICY IF EXISTS "Allow public read settings" ON public.pomodoro_settings;
DROP POLICY IF EXISTS "Allow public update settings" ON public.pomodoro_settings;

-- RLS for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS for tags
CREATE POLICY "Users can view their own tags" 
ON public.tags FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
ON public.tags FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
ON public.tags FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
ON public.tags FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for cycle_records (user-owned)
CREATE POLICY "Users can view their own cycles" 
ON public.cycle_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cycles" 
ON public.cycle_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycles" 
ON public.cycle_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycles" 
ON public.cycle_records FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for pomodoro_settings (user-owned)
CREATE POLICY "Users can view their own settings" 
ON public.pomodoro_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.pomodoro_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.pomodoro_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS for cycle_tags
CREATE POLICY "Users can view their own cycle tags" 
ON public.cycle_tags FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.cycle_records 
  WHERE cycle_records.id = cycle_tags.cycle_id 
  AND cycle_records.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own cycle tags" 
ON public.cycle_tags FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.cycle_records 
  WHERE cycle_records.id = cycle_tags.cycle_id 
  AND cycle_records.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own cycle tags" 
ON public.cycle_tags FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.cycle_records 
  WHERE cycle_records.id = cycle_tags.cycle_id 
  AND cycle_records.user_id = auth.uid()
));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Create default settings for new user
  INSERT INTO public.pomodoro_settings (user_id, immersion_minutes, dive_minutes, breath_minutes)
  VALUES (NEW.id, 25, 25, 5);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_cycle_records_user_id ON public.cycle_records(user_id);
CREATE INDEX idx_cycle_records_created_at ON public.cycle_records(created_at);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_pomodoro_settings_user_id ON public.pomodoro_settings(user_id);