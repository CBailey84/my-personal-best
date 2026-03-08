import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const WORKOUTS = [
  { id: 'run', label: 'Run', icon: '🏃', primaryUnit: 'km', resultUnit: 'min' },
  { id: 'bike', label: 'Bike', icon: '🚴', primaryUnit: 'km', resultUnit: 'min' },
  { id: 'bench', label: 'Bench Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'leg-press', label: 'Leg Press', icon: '🦵', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'push-ups', label: 'Push Ups', icon: '💪', primaryUnit: 'reps', resultUnit: 'reps' },
  { id: 'pull-ups', label: 'Pull Ups', icon: '🧗', primaryUnit: 'reps', resultUnit: 'reps' },
];

interface PB {
  id: string;
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
  achieved_at: string;
}

export default function PersonalBests() {
  const { user } = useAuth();
  const [pbs, setPbs] = useState<PB[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<typeof WORKOUTS[0] | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadPBs();
  }, [user]);

  const loadPBs = async () => {
    const { data } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', user!.id)
      .order('achieved_at', { ascending: false });
    if (data) setPbs(data as PB[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedWorkout || !targetValue || !resultValue) return;
    setSaving(true);

    const { error } = await supabase.from('personal_bests').upsert(
      {
        user_id: user!.id,
        workout_type: selectedWorkout.id,
        target_value: parseFloat(targetValue),
        target_unit: selectedWorkout.primaryUnit,
        result_value: parseFloat(resultValue),
        result_unit: selectedWorkout.resultUnit,
        achieved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,workout_type,target_value,target_unit' }
    );

    if (error) {
      toast({ title: 'Error saving PB', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🏆 Personal Best recorded!' });
      await loadPBs();
      resetForm();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedWorkout(null);
    setTargetValue('');
    setResultValue('');
    setSearch('');
  };

  const getWorkout = (id: string) => WORKOUTS.find((w) => w.id === id);

  const filteredWorkouts = WORKOUTS.filter((w) =>
    w.label.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          PERSONAL <span className="text-amber-400">BESTS</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition-all hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" /> Add PB
        </button>
      </div>

      {/* Add PB Form */}
      {showForm && (
        <div className="mb-6 animate-slide-up rounded-xl border border-amber-500/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">Record a PB</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!selectedWorkout ? (
            <>
              <div className="relative mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workouts..."
                  className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-4 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredWorkouts.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkout(w)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-amber-500/50 hover:bg-muted"
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-sm font-medium text-foreground">{w.label}</span>
                  </button>
                ))}
                {filteredWorkouts.length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No workouts found</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <span className="text-2xl">{selectedWorkout.icon}</span>
                <span className="font-medium text-foreground">{selectedWorkout.label}</span>
                <button onClick={() => setSelectedWorkout(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
                  Change
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Distance / Reps ({selectedWorkout.primaryUnit})
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={`e.g. ${selectedWorkout.primaryUnit === 'km' ? '5' : '10'}`}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Best Result ({selectedWorkout.resultUnit})
                </label>
                <input
                  type="number"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder={`e.g. ${selectedWorkout.resultUnit === 'min' ? '25' : '80'}`}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!targetValue || !resultValue || saving}
                className="w-full rounded-lg bg-amber-500 py-3 font-heading font-semibold text-amber-950 transition-all hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '🏆 Save Personal Best'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PB Tiles */}
      <div className="space-y-3">
        {pbs.map((pb) => {
          const workout = getWorkout(pb.workout_type);
          return (
            <div
              key={pb.id}
              className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-amber-600/5 p-4"
              style={{ boxShadow: '0 0 20px hsl(38 92% 50% / 0.15), inset 0 1px 0 hsl(38 92% 70% / 0.1)' }}
            >
              {/* Decorative shimmer */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-400/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-2 -bottom-2 h-12 w-12 rounded-full bg-amber-500/5 blur-xl" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-2xl">
                  {workout?.icon ?? '🏅'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-amber-300">
                      {workout?.label ?? pb.workout_type}
                    </h3>
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pb.target_value} {pb.target_unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-bold text-amber-400" style={{ textShadow: '0 0 12px hsl(38 92% 50% / 0.4)' }}>
                    {pb.result_value}
                  </p>
                  <p className="text-xs text-amber-400/60">{pb.result_unit}</p>
                </div>
              </div>

              <div className="mt-2 text-right">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(pb.achieved_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}

        {pbs.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-3 text-5xl">🏆</span>
            <p className="text-muted-foreground">No personal bests yet. Record your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
