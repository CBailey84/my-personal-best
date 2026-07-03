-- Reload PostgREST schema cache to pick up the new 'sets' column on workouts
NOTIFY pgrst, 'reload schema';