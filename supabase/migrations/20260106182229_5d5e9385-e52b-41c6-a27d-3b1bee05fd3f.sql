-- Table for storing active timer sessions (for realtime sync across devices)
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'immersion',
  time_left INTEGER NOT NULL DEFAULT 1500, -- seconds
  total_time INTEGER NOT NULL DEFAULT 1500, -- seconds
  is_running BOOLEAN NOT NULL DEFAULT false,
  cycle_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extra_time_seconds INTEGER DEFAULT 0, -- overfocus tracking
  is_overtime BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT active_sessions_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for active_sessions
CREATE POLICY "Users can view their own session" 
ON public.active_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session" 
ON public.active_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session" 
ON public.active_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session" 
ON public.active_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Table for tag groups
CREATE TABLE public.tag_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'hsl(200, 80%, 55%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tag_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tag_groups
CREATE POLICY "Users can view their own tag groups" 
ON public.tag_groups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tag groups" 
ON public.tag_groups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tag groups" 
ON public.tag_groups FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tag groups" 
ON public.tag_groups FOR DELETE 
USING (auth.uid() = user_id);

-- Add group_id to tags table
ALTER TABLE public.tags ADD COLUMN group_id UUID REFERENCES public.tag_groups(id) ON DELETE SET NULL;

-- Enable realtime for active_sessions (for multi-device sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

-- Create index for faster queries
CREATE INDEX idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX idx_tags_group_id ON public.tags(group_id);