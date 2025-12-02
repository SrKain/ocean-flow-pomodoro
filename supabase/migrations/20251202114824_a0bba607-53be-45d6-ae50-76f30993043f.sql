-- Create table for cycle records
CREATE TABLE public.cycle_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase TEXT NOT NULL CHECK (phase IN ('immersion', 'dive', 'breath')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  tag TEXT,
  actions TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for user settings
CREATE TABLE public.pomodoro_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  immersion_minutes INTEGER NOT NULL DEFAULT 25,
  dive_minutes INTEGER NOT NULL DEFAULT 5,
  breath_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.pomodoro_settings (immersion_minutes, dive_minutes, breath_minutes) 
VALUES (25, 5, 5);

-- Enable RLS
ALTER TABLE public.cycle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Allow public read cycle_records" ON public.cycle_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert cycle_records" ON public.cycle_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read settings" ON public.pomodoro_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON public.pomodoro_settings FOR UPDATE USING (true);

-- Create function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings
CREATE TRIGGER update_pomodoro_settings_updated_at
  BEFORE UPDATE ON public.pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();