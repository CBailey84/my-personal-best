CREATE POLICY "Users can delete their own challenges"
ON public.user_challenges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);