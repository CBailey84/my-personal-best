import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Search, Dumbbell, CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

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

interface Workout {
  id: string;
  workout_type: string;
  target_value: number;
  target_unit: string;
  result_value: number;
  result_unit: string;
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
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editResultValue, setEditResultValue] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    if (user) loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user!.id)
      .order('workout_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setWorkouts(data as Workout[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedWorkout || !targetValue || !resultValue) return;
    setSaving(true);

    const { error } = await supabase.from('workouts').insert({
      user_id: user!.id,
      workout_type: selectedWorkout.id,
      target_value: parseFloat(targetValue),
      target_unit: selectedWorkout.primaryUnit,
      result_value: parseFloat(resultValue),
      result_unit: selectedWorkout.resultUnit,
      workout_date: workoutDate,
    });

    if (error) {
      toast({ title: 'Error saving workout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '💪 Workout logged!' });
      await loadWorkouts();
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
    setWorkoutDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting workout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Workout deleted' });
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const startEdit = (w: Workout) => {
    setEditingWorkout(w);
    setEditTargetValue(String(w.target_value));
    setEditResultValue(String(w.result_value));
    setEditDate(w.workout_date);
  };

  const handleEditSave = async () => {
    if (!editingWorkout) return;
    const { error } = await supabase.from('workouts').update({
      target_value: parseFloat(editTargetValue),
      result_value: parseFloat(editResultValue),
      workout_date: editDate,
    }).eq('id', editingWorkout.id);
    if (error) {
      toast({ title: 'Error updating workout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Workout updated' });
      await loadWorkouts();
      setEditingWorkout(null);
    }
  };

  const getWorkout = (id: string) => WORKOUTS.find((w) => w.id === id);

  const filteredFormWorkouts = WORKOUTS.filter((w) =>
    w.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWorkouts = useMemo(() => {
    let list = workouts;
    if (selectedDates.size > 0) {
      list = list.filter((w) => selectedDates.has(w.workout_date));
    }
    if (listSearch) {
      const q = listSearch.toLowerCase();
      list = list.filter((w) => {
        const wk = getWorkout(w.workout_type);
        return (wk?.label ?? w.workout_type).toLowerCase().includes(q);
      });
    }
    return list;
  }, [workouts, listSearch, selectedDates]);

  // Calendar data
  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    workouts.forEach((w) => dates.add(w.workout_date));
    return dates;
  }, [workouts]);

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

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
          MY <span className="text-primary">WORKOUTS</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Log Workout
        </button>
      </div>

      {/* Add Workout Form */}
      {showForm && (
        <div className="mb-6 animate-slide-up rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">Log Workout</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
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
                {filteredFormWorkouts.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkout(w)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-primary hover:bg-muted"
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-sm font-medium text-foreground">{w.label}</span>
                  </button>
                ))}
                {filteredFormWorkouts.length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No workouts found</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <span className="text-2xl">{selectedWorkout.icon}</span>
                <span className="font-medium text-foreground">{selectedWorkout.label}</span>
                <button onClick={() => setSelectedWorkout(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
                  Change
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {selectedWorkout.primaryUnit === 'km' ? 'Distance' : 'Reps'} ({selectedWorkout.primaryUnit})
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={`e.g. ${selectedWorkout.primaryUnit === 'km' ? '5' : '10'}`}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {selectedWorkout.resultUnit === 'min' ? 'Time' : selectedWorkout.resultUnit === 'kg' ? 'Weight' : 'Count'} ({selectedWorkout.resultUnit})
                </label>
                <input
                  type="number"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder={`e.g. ${selectedWorkout.resultUnit === 'min' ? '30' : '60'}`}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!targetValue || !resultValue || saving}
                className="w-full rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💪 Log Workout'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search logged workouts */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          placeholder="Search logged workouts..."
          className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Workout List */}
      <div className="space-y-3">
        {filteredWorkouts.map((w) => {
          const workout = getWorkout(w.workout_type);
          return (
            <div
              key={w.id}
              className="rounded-xl border border-border bg-card p-4 transition-all"
            >
              {editingWorkout?.id === w.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{workout?.icon ?? '🏅'}</span>
                    <span className="font-heading font-bold text-foreground">{workout?.label ?? w.workout_type}</span>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{w.target_unit}</label>
                      <input type="number" value={editTargetValue} onChange={(e) => setEditTargetValue(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{w.result_unit}</label>
                      <input type="number" value={editResultValue} onChange={(e) => setEditResultValue(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Save</button>
                    <button onClick={() => setEditingWorkout(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{workout?.icon ?? '🏅'}</span>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {workout?.label ?? w.workout_type}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {w.target_value} {w.target_unit}
                      <span className="mx-1.5 text-border">·</span>
                      {w.result_value} {w.result_unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground mr-1">
                      {format(parseISO(w.workout_date), 'dd MMM yyyy')}
                    </p>
                    <button onClick={() => startEdit(w)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredWorkouts.length === 0 && workouts.length > 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No workouts match your search.</p>
        )}

        {workouts.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 text-center">
            <Dumbbell className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No workouts logged yet. Start tracking!</p>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {selectedDates.size > 0 && (
        <div className="mt-8 mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Filtering by {selectedDates.size} day{selectedDates.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setSelectedDates(new Set())}
            className="text-xs text-primary hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
      <div className={`${selectedDates.size > 0 ? 'mt-0' : 'mt-8'} rounded-xl border border-border bg-card p-4`}>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
            className="rounded-lg px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ‹
          </button>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {format(calendarMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
            className="rounded-lg px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {d}
            </span>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasWorkout = workoutDates.has(dateStr);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDates.has(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (!hasWorkout) return;
                  setSelectedDates((prev) => {
                    const next = new Set(prev);
                    if (next.has(dateStr)) {
                      next.delete(dateStr);
                    } else {
                      next.add(dateStr);
                    }
                    return next;
                  });
                }}
                disabled={!hasWorkout}
                className={`flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/50'
                    : hasWorkout
                    ? 'bg-primary/20 text-primary font-bold cursor-pointer hover:bg-primary/30'
                    : isToday
                    ? 'border border-border text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {day.getDate()}
                {hasWorkout && !isSelected && (
                  <span className="ml-0.5 text-[8px]">●</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
