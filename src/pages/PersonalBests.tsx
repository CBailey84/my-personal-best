import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WORKOUTS = [
  { id: 'run', label: 'Run', icon: '🏃', primaryUnit: 'km', resultUnit: 'min', bestIs: 'lowest' as const },
  { id: 'bike', label: 'Bike', icon: '🚴', primaryUnit: 'km', resultUnit: 'min', bestIs: 'lowest' as const },
  { id: 'bench', label: 'Bench Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'leg-press', label: 'Leg Press', icon: '🦵', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'push-ups', label: 'Push Ups', icon: '🙌', primaryUnit: 'reps', resultUnit: 'reps', bestIs: 'highest' as const },
  { id: 'pull-ups', label: 'Pull Ups', icon: '✊', primaryUnit: 'reps', resultUnit: 'reps', bestIs: 'highest' as const },
  { id: 'bicep-curls', label: 'Bicep Curls', icon: '💪', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'shoulder-press', label: 'Shoulder Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'seated-row', label: 'Seated Row', icon: '🚣', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'dead-hang', label: 'Dead-hang', icon: '🧗', primaryUnit: 'reps', resultUnit: 'sec', bestIs: 'highest' as const },
  { id: 'barbell-squats', label: 'Barbell Squats', icon: '🏋️‍♂️', primaryUnit: 'reps', resultUnit: 'kg', bestIs: 'highest' as const },
  { id: 'swim', label: 'Swim', icon: '🏊', primaryUnit: 'meters', resultUnit: 'min', bestIs: 'lowest' as const },
];

interface WorkoutRecord {
  id: string;
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
  workout_date: string;
}

interface PBEntry {
  source_workout_id: string;
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
  const [selectedWorkout, setSelectedWorkout] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    loadWorkouts();
  }, [user]);

  async function loadWorkouts() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false });

    if (error) {
      toast({ title: 'Error loading workouts', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    setAllWorkouts(data || []);
    setLoading(false);
  }

  function getWorkoutMeta(workoutType: string) {
    return WORKOUTS.find(w => w.id === workoutType);
  }

  function getWorkoutDisplayName(workoutType: string) {
    const workout = getWorkoutMeta(workoutType);
    return workout ? `${workout.icon} ${workout.label}` : workoutType;
  }

  function getWorkoutUnit(workoutType: string, unitType: 'target' | 'result') {
    const workout = getWorkoutMeta(workoutType);
    if (!workout) return '';
    return unitType === 'target' ? workout.primaryUnit : workout.resultUnit;
  }

  const pbEntries = useMemo(() => {
    const byType = new Map<string, WorkoutRecord[]>();

    for (const w of allWorkouts) {
      if (selectedWorkout !== 'all' && w.workout_type !== selectedWorkout) continue;
      if (!byType.has(w.workout_type)) byType.set(w.workout_type, []);
      byType.get(w.workout_type)!.push(w);
    }

    const out: PBEntry[] = [];

    for (const [type, list] of byType.entries()) {
      const cfg = getWorkoutMeta(type);
      if (!cfg || list.length === 0) continue;

      let best: WorkoutRecord;
      if (cfg.bestIs === 'lowest') {
        best = list.reduce((acc, curr) => (curr.result_value < acc.result_value ? curr : acc));
      } else {
        best = list.reduce((acc, curr) => (curr.result_value > acc.result_value ? curr : acc));
      }

      out.push({
        source_workout_id: best.id,
        workout_type: best.workout_type,
        target_value: best.target_value,
        target_unit: best.target_unit,
        result_value: best.result_value,
        result_unit: best.result_unit,
        workout_date: best.workout_date,
      });
    }

    return out.sort((a, b) => a.workout_type.localeCompare(b.workout_type));
  }, [allWorkouts, selectedWorkout]);

  async function deletePB(pb: PBEntry) {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', pb.source_workout_id)
      .eq('user_id', user?.id ?? '');

    if (error) {
      toast({ title: 'Could not delete PB', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'PB deleted' });
    await loadWorkouts();
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center animate-slide-up">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Personal Bests
          </h1>
          <p className="text-muted-foreground">Your top performances by workout</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 animate-scale-in">
          <label className="text-sm font-medium text-foreground mb-2 block">Filter workout</label>
          <select
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"
          >
            <option value="all">All workouts</option>
            {WORKOUTS.map(w => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading PBs...</div>
          ) : pbEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No PBs yet. Log workouts to generate PBs.</div>
          ) : (
            pbEntries.map((pb) => (
              <div key={pb.source_workout_id} className="bg-card border border-border rounded-xl p-4 animate-scale-in">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{getWorkoutDisplayName(pb.workout_type)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pb.target_value}
                      {getWorkoutUnit(pb.workout_type, 'target')} → {pb.result_value}
                      {getWorkoutUnit(pb.workout_type, 'result')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{pb.workout_date}</div>
                  </div>
                  <button
                    onClick={() => deletePB(pb)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Delete PB source workout"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
