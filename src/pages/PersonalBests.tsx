import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';

const WORKOUTS = [
  { id: 'run', label: 'Run', icon: '🏃', primaryUnit: 'km', resultUnit: 'min', bestIs: 'lowest' as const },
  { id: 'bike', label: 'Bike', icon: '🚴', primaryUnit: 'km', resultUnit: 'min', bestIs: 'lowest' as const },
  { id: 'bench', label: 'Bench Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'leg-press', label: 'Leg Press', icon: '🦵', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'push-ups', label: 'Push Ups', icon: '💪', primaryUnit: 'reps', resultUnit: 'reps', bestIs: 'highest' as const },
  { id: 'pull-ups', label: 'Pull Ups', icon: '🧗', primaryUnit: 'reps', resultUnit: 'reps', bestIs: 'highest' as const },
];

interface WorkoutRecord {
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
  workout_date: string;
}

interface PBEntry {
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
  workout_date: string;
}

export default function PersonalBests() {
  const { user } = useAuth();
  const [allWorkouts, setAllWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('workout_type, target_value, target_unit, result_value, result_unit, workout_date')
      .eq('user_id', user!.id);
    if (data) setAllWorkouts(data as WorkoutRecord[]);
    setLoading(false);
  };

  // Derive PBs: best result per workout_type + target_value combo
  const pbs = useMemo(() => {
    const map = new Map<string, PBEntry>();

    allWorkouts.forEach((w) => {
      const key = `${w.workout_type}|${w.target_value}|${w.target_unit}`;
      const existing = map.get(key);
      const wkDef = WORKOUTS.find((wk) => wk.id === w.workout_type);
      const isBetter = !existing || (
        wkDef?.bestIs === 'lowest'
          ? w.result_value < existing.result_value
          : w.result_value > existing.result_value
      );

      if (isBetter) {
        map.set(key, {
          workout_type: w.workout_type,
          target_value: w.target_value,
          target_unit: w.target_unit,
          result_value: w.result_value,
          result_unit: w.result_unit,
          workout_date: w.workout_date,
        });
      }
    });

    return Array.from(map.values());
  }, [allWorkouts]);

  const getWorkout = (id: string) => WORKOUTS.find((w) => w.id === id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          PERSONAL <span className="text-gold-light">BESTS</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatically tracked from your logged workouts
        </p>
      </div>

      {/* PB Tiles */}
      <div className="space-y-3">
        {pbs.map((pb) => {
          const workout = getWorkout(pb.workout_type);
          const key = `${pb.workout_type}-${pb.target_value}-${pb.target_unit}`;
          return (
            <div
              key={key}
              className="relative overflow-hidden rounded-xl border border-gold/40 p-4"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--gold) / 0.1), hsl(var(--card)), hsl(var(--gold) / 0.05))',
                boxShadow: 'var(--gold-glow), inset 0 1px 0 hsl(var(--gold-light) / 0.1)',
              }}
            >
              {/* Decorative shimmer */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-2 -bottom-2 h-12 w-12 rounded-full bg-gold/5 blur-xl" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-2xl">
                  {workout?.icon ?? '🏅'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-gold-light">
                      {workout?.label ?? pb.workout_type}
                    </h3>
                    <Trophy className="h-4 w-4 text-gold" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pb.target_value} {pb.target_unit}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-heading text-2xl font-bold text-gold"
                    style={{ textShadow: '0 0 12px hsl(var(--gold) / 0.4)' }}
                  >
                    {pb.result_value}
                  </p>
                  <p className="text-xs text-gold/60">{pb.result_unit}</p>
                </div>
              </div>

              <div className="mt-2 text-right">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(pb.workout_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}

        {pbs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-3 text-5xl">🏆</span>
            <p className="text-muted-foreground">No personal bests yet. Log workouts to see your records here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
