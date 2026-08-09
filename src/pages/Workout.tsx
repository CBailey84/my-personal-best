import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Search, Dumbbell, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import Fireworks from '@/components/Fireworks';

const WORKOUTS = [
  { id: 'run', label: 'Run', icon: '🏃', primaryUnit: 'km', resultUnit: 'min' },
  { id: 'bike', label: 'Bike', icon: '🚴', primaryUnit: 'km', resultUnit: 'min' },
  { id: 'bench', label: 'Bench Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'leg-press', label: 'Leg Press', icon: '🦵', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'push-ups', label: 'Push Ups', icon: '🙌', primaryUnit: 'reps', resultUnit: 'reps' },
  { id: 'pull-ups', label: 'Pull Ups', icon: '✊', primaryUnit: 'reps', resultUnit: 'reps' },
  { id: 'bicep-curls', label: 'Bicep Curls', icon: '💪', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'shoulder-press', label: 'Shoulder Press', icon: '🏋️', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'seated-row', label: 'Seated Row', icon: '🚣', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'dead-hang', label: 'Dead-hang', icon: '🧗', primaryUnit: 'reps', resultUnit: 'sec' },
  { id: 'barbell-squats', label: 'Barbell Squats', icon: '🏋️‍♂️', primaryUnit: 'reps', resultUnit: 'kg' },
  { id: 'swim', label: 'Swim', icon: '🏊', primaryUnit: 'meters', resultUnit: 'min' },
];

const CARDIO_WORKOUT_IDS = new Set(['run', 'bike', 'swim']);

interface Workout {
  id: string;
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
  sets: number | null;
  workout_date: string;
  created_at: string;
}

export default function WorkoutPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<typeof WORKOUTS[0] | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [sets, setSets] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editResultValue, setEditResultValue] = useState('');
  const [editSets, setEditSets] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editWorkoutType, setEditWorkoutType] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'new' | 'pb'>('new');

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
      .order('workout_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading workouts', description: error.message, variant: 'destructive' });
    } else {
      setWorkouts(data || []);
    }
    setLoading(false);
  }

  const filteredWorkouts = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return workouts;
    return workouts.filter((w) =>
      w.workout_type.toLowerCase().includes(q) ||
      String(w.target_value).includes(q) ||
      String(w.result_value).includes(q) ||
      (w.target_unit || '').toLowerCase().includes(q) ||
      (w.result_unit || '').toLowerCase().includes(q)
    );
  }, [workouts, listSearch]);

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of filteredWorkouts) {
      const month = format(parseISO(w.workout_date), 'yyyy-MM');
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(w);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filteredWorkouts]);

  const selectedMeta = selectedWorkout ? WORKOUTS.find((w) => w.id === selectedWorkout.id) : null;

  async function handleAddWorkout() {
    if (!user || !selectedWorkout || !targetValue || !resultValue || !date) return;
    const target = Number(targetValue);
    const result = Number(resultValue);
    const setsNum = sets ? Number(sets) : null;
    if (Number.isNaN(target) || Number.isNaN(result)) return;

    setSaving(true);

    const targetUnit = selectedWorkout.primaryUnit;
    const resultUnit = selectedWorkout.resultUnit;

    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      workout_type: selectedWorkout.id,
      target_value: target,
      target_unit: targetUnit,
      result_value: result,
      result_unit: resultUnit,
      sets: setsNum,
      workout_date: date,
    });

    if (error) {
      toast({ title: 'Could not save workout', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    const workoutConfig = WORKOUTS.find(w => w.id === selectedWorkout.id);
    if (workoutConfig) {
      const sameTypeWorkouts = workouts.filter(w => w.workout_type === selectedWorkout.id);
      const isCardio = CARDIO_WORKOUT_IDS.has(selectedWorkout.id);
      
      let isNewPB = false;
      if (sameTypeWorkouts.length === 0) {
        isNewPB = true;
      } else if (isCardio) {
        const bestTime = Math.min(...sameTypeWorkouts.map(w => w.result_value));
        isNewPB = result < bestTime;
      } else {
        const bestWeight = Math.max(...sameTypeWorkouts.map(w => w.result_value));
        isNewPB = result > bestWeight;
      }

      setAnimationType(isNewPB ? 'pb' : 'new');
      setShowSuccessAnimation(true);
    }

    toast({ title: 'Workout saved 💪' });
    setShowForm(false);
    setSelectedWorkout(null);
    setTargetValue('');
    setResultValue('');
    setSets('');
    setDate(new Date().toISOString().slice(0, 10));
    await loadWorkouts();
    setSaving(false);
  }

  function startEdit(w: Workout) {
    setEditingWorkout(w);
    setEditTargetValue(String(w.target_value));
    setEditResultValue(String(w.result_value));
    setEditSets(w.sets == null ? '' : String(w.sets));
    setEditDate(w.workout_date);
    setEditWorkoutType(w.workout_type);
  }

  async function saveEdit() {
    if (!editingWorkout) return;
    const target = Number(editTargetValue);
    const result = Number(editResultValue);
    const setsNum = editSets ? Number(editSets) : null;
    if (Number.isNaN(target) || Number.isNaN(result)) return;

    const workoutMeta = WORKOUTS.find(w => w.id === editWorkoutType);
    if (!workoutMeta) return;

    const { error } = await supabase
      .from('workouts')
      .update({
        workout_type: editWorkoutType,
        target_value: target,
        result_value: result,
        sets: setsNum,
        workout_date: editDate,
        target_unit: workoutMeta.primaryUnit,
        result_unit: workoutMeta.resultUnit,
      })
      .eq('id', editingWorkout.id)
      .eq('user_id', user?.id ?? '');

    if (error) {
      toast({ title: 'Could not update workout', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Workout updated' });
    setEditingWorkout(null);
    await loadWorkouts();
  }

  function requestDelete(w: Workout) {
    setWorkoutToDelete(w);
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!workoutToDelete || !user) return;
    
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutToDelete.id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Could not delete workout', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Workout deleted' });
    setShowDeleteConfirm(false);
    setWorkoutToDelete(null);
    await loadWorkouts();
  }

  function cancelDelete() {
    setShowDeleteConfirm(false);
    setWorkoutToDelete(null);
  }

  function getWorkoutDisplayName(workoutType: string) {
    const workout = WORKOUTS.find(w => w.id === workoutType);
    return workout ? `${workout.icon} ${workout.label}` : workoutType;
  }

  function getWorkoutUnit(workoutType: string, unitType: 'target' | 'result') {
    const workout = WORKOUTS.find(w => w.id === workoutType);
    if (!workout) return '';
    return unitType === 'target' ? workout.primaryUnit : workout.resultUnit;
  }

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const workoutDaysThisMonth = new Set(
    workouts
      .filter(w => {
        const workoutDate = parseISO(w.workout_date);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      })
      .map(w => w.workout_date)
  );

  const totalWorkoutsThisMonth = workouts.filter(w => {
    const workoutDate = parseISO(w.workout_date);
    return workoutDate >= monthStart && workoutDate <= monthEnd;
  }).length;

  const longestStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    const sortedDates = [...new Set(workouts.map(w => w.workout_date))].sort();
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1]);
      const currDate = parseISO(sortedDates[i]);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }, [workouts]);

  const currentStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    const sortedDates = [...new Set(workouts.map(w => w.workout_date))].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;
    
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1]);
      const currDate = parseISO(sortedDates[i]);
      const diffTime = prevDate.getTime() - currDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [workouts]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      {showSuccessAnimation && (
        <Fireworks
          show={showSuccessAnimation}
          type={animationType}
          onComplete={() => setShowSuccessAnimation(false)}
        />
      )}
      
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center animate-slide-up">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary" />
            Workouts
          </h1>
          <p className="text-muted-foreground">Track your fitness journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <div className="bg-gradient-primary rounded-xl p-4 text-primary-foreground">
            <div className="text-2xl font-bold">{totalWorkoutsThisMonth}</div>
            <div className="text-sm opacity-90">This Month</div>
          </div>
          <div className="bg-gradient-success rounded-xl p-4 text-success-foreground">
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-3">This Month's Activity</h3>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-xs text-muted-foreground text-center p-1">
                {day}
              </div>
            ))}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasWorkout = workoutDaysThisMonth.has(dateStr);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={dateStr}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                    hasWorkout
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Workout Button */}
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-4 px-6 font-semibold flex items-center justify-center gap-2 shadow-medium hover:shadow-strong transform hover:-translate-y-0.5 transition-all duration-200 animate-slide-up"
        >
          <Plus className="w-5 h-5" />
          Add Workout
        </button>

        {/* Add Workout Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">New Workout</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Workout Type</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search workouts..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-border">
                  {WORKOUTS.filter(w => w.label.toLowerCase().includes(search.toLowerCase())).map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWorkout(w);
                        setSearch(w.label);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${
                        selectedWorkout?.id === w.id ? 'bg-muted' : ''
                      }`}
                    >
                      {w.icon} {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedWorkout && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Target ({selectedMeta?.primaryUnit})
                      </label>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={e => setTargetValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Result ({selectedMeta?.resultUnit})
                      </label>
                      <input
                        type="number"
                        value={resultValue}
                        onChange={e => setResultValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Sets (optional)</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={e => setSets(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleAddWorkout}
              disabled={!selectedWorkout || !targetValue || !resultValue || saving}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Workout'}
            </button>
          </div>
        )}

        {/* Workout List Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
            placeholder="Search logged workouts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background"
          />
        </div>

        {/* Workouts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading workouts...</div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No workouts found.</div>
          ) : (
            groupedByMonth.map(([month, items]) => (
              <div key={month} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                </h3>
                <div className="space-y-2">
                  {items.map((w) => (
                    <div key={w.id} className="bg-card border border-border rounded-xl p-4 animate-scale-in">
                      {editingWorkout?.id === w.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Workout Type</label>
                            <select
                              value={editWorkoutType}
                              onChange={e => setEditWorkoutType(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                            >
                              {WORKOUTS.map(workout => (
                                <option key={workout.id} value={workout.id}>
                                  {workout.icon} {workout.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1 block">
                                Target ({getWorkoutUnit(editWorkoutType, 'target')})
                              </label>
                              <input
                                type="number"
                                value={editTargetValue}
                                onChange={e => setEditTargetValue(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1 block">
                                Result ({getWorkoutUnit(editWorkoutType, 'result')})
                              </label>
                              <input
                                type="number"
                                value={editResultValue}
                                onChange={e => setEditResultValue(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1 block">Sets</label>
                              <input
                                type="number"
                                value={editSets}
                                onChange={e => setEditSets(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={e => setEditDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWorkout(null)}
                              className="flex-1 bg-muted text-muted-foreground rounded-lg py-2 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-foreground">
                              {getWorkoutDisplayName(w.workout_type)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {w.target_value}
                              {getWorkoutUnit(w.workout_type, 'target')} → {w.result_value}
                              {getWorkoutUnit(w.workout_type, 'result')}
                              {w.sets != null ? ` • ${w.sets} sets` : ''}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(w.workout_date), 'dd MMM yyyy')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(w)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              title="Edit workout"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => requestDelete(w)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="Delete workout"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Longest Streak Card */}
        <div className="bg-gradient-secondary rounded-xl p-4 text-secondary-foreground animate-slide-up">
          <div className="text-2xl font-bold">{longestStreak}</div>
          <div className="text-sm opacity-90">Longest Streak</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && workoutToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-semibold text-foreground mb-2">Delete Workout?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="text-sm bg-muted rounded-lg p-3 mb-4">
              <div className="font-medium">{getWorkoutDisplayName(workoutToDelete.workout_type)}</div>
              <div className="text-muted-foreground">
                {workoutToDelete.target_value}{getWorkoutUnit(workoutToDelete.workout_type, 'target')} → {workoutToDelete.result_value}{getWorkoutUnit(workoutToDelete.workout_type, 'result')}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-muted text-muted-foreground rounded-lg py-2.5 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-2.5 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
