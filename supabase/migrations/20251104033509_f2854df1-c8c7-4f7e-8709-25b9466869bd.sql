-- Add UPDATE and DELETE policies for user_interactions to give users full control over their data

-- Allow users to update their own interactions
CREATE POLICY "Users can update their own interactions"
ON public.user_interactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own interactions
CREATE POLICY "Users can delete their own interactions"
ON public.user_interactions
FOR DELETE
USING (auth.uid() = user_id);