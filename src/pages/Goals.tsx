import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Check, Search, X, Bike, Footprints, Dumbbell, ArrowUp, ArrowDown, Eye, EyeOff, Bot, Pencil, Trash2 } from 'lucide-react';

const WORKOUTS = [
  { id: 'run', label: 'Run', icon: '🏃', primaryUnit: 'km', secondaryUnit: 'min' },
  { id: 'bike', label: 'Bike', icon: '🚴', primaryUnit: 'km', secondaryUnit: 'min' },
  { id: 'bench', label: 'Bench Press', icon: '🏋️', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'leg-press', label: 'Leg Press', icon: '🦵', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'push-ups', label: 'Push Ups', icon: '🙌', primaryUnit: 'reps', secondaryUnit: null },
  { id: 'pull-ups', label: 'Pull Ups', icon: '✊', primaryUnit: 'reps', secondaryUnit: null },
  { id: 'bicep-curls', label: 'Bicep Curls', icon: '💪', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'shoulder-press', label: 'Shoulder Press', icon: '🏋️', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'seated-row', label: 'Seated Row', icon: '🚣', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'dead-hang', label: 'Dead-hang', icon: '🧗', primaryUnit: 'reps', secondaryUnit: 'sec' },
  { id: 'barbell-squats', label: 'Barbell Squats', icon: '🏋️‍♂️', primaryUnit: 'reps', secondaryUnit: 'kg' },
  { id: 'swim', label: 'Swim', icon: '🏊', primaryUnit: 'meters', secondaryUnit: 'min' },
];

interface Goal {
  id: string;
  workout_type: string;
  target_value: number;
  target_unit: string;
  secondary_value: number | null;
  secondary_unit: string | null;
  completed: boolean;
  created_at: string;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<typeof WORKOUTS[0] | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editSecondaryValue, setEditSecondaryValue] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const displayedGoals = useMemo(() => {
    return hideCompleted ? goals.filter((g) => !g.completed) : goals;
  }, [goals, hideCompleted]);

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });
    if (data) setGoals(data as Goal[]);
  };

  const filteredWorkouts = WORKOUTS.filter((w) =>
    w.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedWorkout || !targetValue) return;
    setSaving(true);
    await supabase.from('goals').insert({
      user_id: user!.id,
      workout_type: selectedWorkout.id,
      target_value: parseFloat(targetValue),
      target_unit: selectedWorkout.primaryUnit,
      secondary_value: secondaryValue ? parseFloat(secondaryValue) : null,
      secondary_unit: selectedWorkout.secondaryUnit,
    });
    await loadGoals();
    setShowForm(false);
    setSelectedWorkout(null);
    setTargetValue('');
    setSecondaryValue('');
    setSearch('');
    setSaving(false);
  };

  const toggleComplete = async (goal: Goal) => {
    await supabase
      .from('goals')
      .update({
        completed: !goal.completed,
        completed_at: !goal.completed ? new Date().toISOString() : null,
      })
      .eq('id', goal.id);
    await loadGoals();
  };

  const getWorkout = (id: string) => WORKOUTS.find((w) => w.id === id);

  const startEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTargetValue(String(goal.target_value));
    setEditSecondaryValue(goal.secondary_value != null ? String(goal.secondary_value) : '');
  };

  const handleEdit = async () => {
    if (!editingGoal || !editTargetValue) return;
    setSaving(true);
    await supabase
      .from('goals')
      .update({
        target_value: parseFloat(editTargetValue),
        secondary_value: editSecondaryValue ? parseFloat(editSecondaryValue) : null,
      })
      .eq('id', editingGoal.id);
    await loadGoals();
    setEditingGoal(null);
    setSaving(false);
  };

  const handleDelete = async (goalId: string) => {
    setDeleting(goalId);
    await supabase.from('goals').delete().eq('id', goalId);
    await loadGoals();
    setDeleting(null);
  };

  const askCoach = (goal: Goal) => {
    const workout = getWorkout(goal.workout_type);
    const goalName = `${workout?.label ?? goal.workout_type} – ${goal.target_value} ${goal.target_unit}${goal.secondary_value != null && goal.secondary_unit ? ` · ${goal.secondary_value} ${goal.secondary_unit}` : ''}`;
    const prompt = `Provide my next workout steps for me to work towards achieving this goal: ${goalName}.`;
    navigate('/assistant', { state: { prefill: prompt } });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          MY <span className="text-primary">GOALS</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Goal
        </button>
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            hideCompleted
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          {hideCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="mb-6 animate-slide-up rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">New Goal</h3>
            <button onClick={() => { setShowForm(false); setSelectedWorkout(null); setSearch(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!selectedWorkout ? (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workouts..."
                  className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredWorkouts.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkout(w)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-primary hover:bg-muted"
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
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <span className="text-2xl">{selectedWorkout.icon}</span>
                <span className="font-medium text-foreground">{selectedWorkout.label}</span>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Target ({selectedWorkout.primaryUnit})
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={`e.g. ${selectedWorkout.primaryUnit === 'km' ? '5' : '20'}`}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {selectedWorkout.secondaryUnit && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {selectedWorkout.secondaryUnit === 'min' ? 'Target Time' : 'Weight'} ({selectedWorkout.secondaryUnit})
                  </label>
                  <input
                    type="number"
                    value={secondaryValue}
                    onChange={(e) => setSecondaryValue(e.target.value)}
                    placeholder={`e.g. ${selectedWorkout.secondaryUnit === 'min' ? '30' : '60'}`}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!targetValue || saving}
                className="w-full rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Goal'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Goal Tiles */}
      <div className="space-y-3 pb-24">
        {displayedGoals.map((goal) => {
          const workout = getWorkout(goal.workout_type);
          return (
            <div
              key={goal.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                goal.completed
                  ? 'border-border/50 bg-muted/30 opacity-60'
                  : 'border-border bg-card box-glow'
              }`}
            >
              <span className="text-3xl">{workout?.icon ?? '🏅'}</span>
              <div className="flex-1">
                <h3 className={`font-heading text-lg font-bold ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {workout?.label ?? goal.workout_type}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {goal.target_value} {goal.target_unit}
                  {goal.secondary_value != null && goal.secondary_unit && (
                    <span> · {goal.secondary_value} {goal.secondary_unit}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => askCoach(goal)}
                  title="Ask AI Coach"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Bot className="h-4 w-4" />
                </button>
                <button
                  onClick={() => startEdit(goal)}
                  title="Edit Goal"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border text-muted-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  disabled={deleting === goal.id}
                  title="Delete Goal"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border text-muted-foreground transition-all hover:border-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleComplete(goal)}
                  title="Completed"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    goal.completed
                      ? 'border-primary/40 bg-primary/20 text-primary'
                      : 'border-border hover:border-primary hover:bg-primary/10'
                  }`}
                >
                  {goal.completed && <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-3 text-5xl">🎯</span>
            <p className="text-muted-foreground">No goals yet. Add your first goal!</p>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (() => {
        const workout = getWorkout(editingGoal.workout_type);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingGoal(null)}>
            <div className="w-full max-w-sm animate-slide-up rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold text-foreground">Edit Goal</h3>
                <button onClick={() => setEditingGoal(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <span className="text-2xl">{workout?.icon ?? '🏅'}</span>
                <span className="font-medium text-foreground">{workout?.label ?? editingGoal.workout_type}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Target ({editingGoal.target_unit})
                  </label>
                  <input
                    type="number"
                    value={editTargetValue}
                    onChange={(e) => setEditTargetValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {editingGoal.secondary_unit && (
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {editingGoal.secondary_unit === 'min' ? 'Target Time' : editingGoal.secondary_unit === 'sec' ? 'Duration' : 'Weight'} ({editingGoal.secondary_unit})
                    </label>
                    <input
                      type="number"
                      value={editSecondaryValue}
                      onChange={(e) => setEditSecondaryValue(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                <button
                  onClick={handleEdit}
                  disabled={!editTargetValue || saving}
                  className="w-full rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
