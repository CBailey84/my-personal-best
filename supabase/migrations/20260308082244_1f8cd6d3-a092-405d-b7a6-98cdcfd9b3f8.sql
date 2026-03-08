
CREATE TABLE public.personal_bests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  result_value NUMERIC NOT NULL,
  result_unit TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workout_type, target_value, target_unit)
);

ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PBs"
  ON public.personal_bests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PBs"
  ON public.personal_bests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PBs"
  ON public.personal_bests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PBs"
  ON public.personal_bests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
