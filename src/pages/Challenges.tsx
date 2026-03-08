import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Check, Trophy, Search, EyeOff, Eye, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Challenge {
  id: string;
  title: string;
  stat: 'speed' | 'stamina' | 'pull_strength' | 'push_strength' | 'leg_power';
  uplift: number;
  category: string;
}

const CHALLENGES: Challenge[] = [
  // Push ups
  { id: 'pushup-10', title: 'Complete 10 push ups in one go', stat: 'push_strength', uplift: 3, category: 'Push Ups' },
  { id: 'pushup-15', title: 'Complete 15 push ups in one go', stat: 'push_strength', uplift: 5, category: 'Push Ups' },
  { id: 'pushup-20', title: 'Complete 20 push ups in one go', stat: 'push_strength', uplift: 10, category: 'Push Ups' },
  { id: 'pushup-30', title: 'Complete 30 push ups in one go', stat: 'push_strength', uplift: 10, category: 'Push Ups' },
  // Running (stamina)
  { id: 'run-5k', title: 'Complete a 5km run', stat: 'stamina', uplift: 7, category: 'Running' },
  { id: 'run-10k', title: 'Complete a 10km run', stat: 'stamina', uplift: 10, category: 'Running' },
  { id: 'run-15k', title: 'Complete a 15km run', stat: 'stamina', uplift: 15, category: 'Running' },
  { id: 'run-half-marathon', title: 'Complete a half marathon run (21km)', stat: 'stamina', uplift: 15, category: 'Running' },
  { id: 'run-marathon', title: 'Complete a marathon run (42km)', stat: 'stamina', uplift: 21, category: 'Running' },
  // Biking
  { id: 'bike-10k', title: 'Complete a 10km bike ride', stat: 'stamina', uplift: 7, category: 'Biking' },
  { id: 'bike-20k', title: 'Complete a 20km bike ride', stat: 'stamina', uplift: 10, category: 'Biking' },
  { id: 'bike-50k', title: 'Complete a 50km bike ride', stat: 'stamina', uplift: 15, category: 'Biking' },
  // Bench press
  { id: 'bench-10x20', title: 'Bench press 10 reps of 20kg', stat: 'push_strength', uplift: 3, category: 'Bench Press' },
  { id: 'bench-1xbw', title: 'Bench press 1 rep at bodyweight', stat: 'push_strength', uplift: 5, category: 'Bench Press' },
  { id: 'bench-2xbw', title: 'Bench press 2 reps at bodyweight', stat: 'push_strength', uplift: 10, category: 'Bench Press' },
  { id: 'bench-10xbw', title: 'Bench press 10 reps at bodyweight', stat: 'push_strength', uplift: 6, category: 'Bench Press' },
  { id: 'bench-10xbw10', title: 'Bench press 10 reps at bodyweight + 10kg', stat: 'push_strength', uplift: 10, category: 'Bench Press' },
  { id: 'bench-10xbw20', title: 'Bench press 10 reps at bodyweight + 20kg', stat: 'push_strength', uplift: 10, category: 'Bench Press' },
  { id: 'bench-1xbw10', title: 'Bench press 1 rep at bodyweight + 10kg', stat: 'push_strength', uplift: 5, category: 'Bench Press' },
  { id: 'bench-1xbw20', title: 'Bench press 1 rep at bodyweight + 20kg', stat: 'push_strength', uplift: 10, category: 'Bench Press' },
  { id: 'bench-10x40', title: 'Bench press 10 reps of 40kg', stat: 'push_strength', uplift: 3, category: 'Bench Press' },
  { id: 'bench-1xbw30', title: 'Bench press 1 rep at bodyweight + 30kg', stat: 'push_strength', uplift: 10, category: 'Bench Press' },
  // Pull ups
   { id: 'pullup-1', title: 'Complete 1 pull up', stat: 'pull_strength', uplift: 3, category: 'Pull Ups' },
  { id: 'pullup-3', title: 'Complete 3 pull ups in one go', stat: 'pull_strength', uplift: 5, category: 'Pull Ups' },
  { id: 'pullup-5', title: 'Complete 5 pull ups in one go', stat: 'pull_strength', uplift: 5, category: 'Pull Ups' },
  { id: 'pullup-10', title: 'Complete 10 pull ups in one go', stat: 'pull_strength', uplift: 10, category: 'Pull Ups' },
  { id: 'pullup-15', title: 'Complete 15 pull ups in one go', stat: 'pull_strength', uplift: 15, category: 'Pull Ups' },
  // Dead hangs
  { id: 'deadhang-1min', title: 'Complete a 1 minute dead-hang', stat: 'pull_strength', uplift: 10, category: 'Dead Hangs' },
  { id: 'deadhang-2min', title: 'Complete a 2 minute dead-hang', stat: 'pull_strength', uplift: 20, category: 'Dead Hangs' },
  // Seated rows
  { id: 'row-10x40', title: 'Complete 10 reps of 40kg seated row', stat: 'pull_strength', uplift: 5, category: 'Seated Rows' },
  { id: 'row-10xbw', title: 'Complete 10 reps of bodyweight seated row', stat: 'pull_strength', uplift: 7, category: 'Seated Rows' },
  // Bicep curls
  { id: 'curl-5kg', title: 'Complete 10 bicep curls of 5kg (per arm)', stat: 'pull_strength', uplift: 2, category: 'Bicep Curls' },
  { id: 'curl-10kg', title: 'Complete 10 bicep curls of 10kg (per arm)', stat: 'pull_strength', uplift: 3, category: 'Bicep Curls' },
  { id: 'curl-15kg', title: 'Complete 10 bicep curls of 15kg (per arm)', stat: 'pull_strength', uplift: 5, category: 'Bicep Curls' },
  { id: 'curl-20kg', title: 'Complete 10 bicep curls of 20kg (per arm)', stat: 'pull_strength', uplift: 10, category: 'Bicep Curls' },
  // Speed
  { id: 'sprint-20s', title: 'Run 100m in 20 seconds or less', stat: 'speed', uplift: 3, category: 'Sprints' },
  { id: 'sprint-16s', title: 'Run 100m in 16 seconds or less', stat: 'speed', uplift: 5, category: 'Sprints' },
  { id: 'sprint-14s', title: 'Run 100m in 14 seconds or less', stat: 'speed', uplift: 10, category: 'Sprints' },
  { id: 'sprint-12s', title: 'Run 100m in 12 seconds or less', stat: 'speed', uplift: 25, category: 'Sprints' },
  { id: 'sprint-20m-5s', title: 'Sprint 20m in 5 seconds or less', stat: 'speed', uplift: 3, category: 'Sprints' },
  { id: 'sprint-20m-4s', title: 'Sprint 20m in 4 seconds or less', stat: 'speed', uplift: 5, category: 'Sprints' },
  { id: 'sprint-20m-3s', title: 'Sprint 20m in 3 seconds or less', stat: 'speed', uplift: 10, category: 'Sprints' },
  // Cycling speed
  { id: 'cycle-1km-2m30', title: 'Cycle 1km in 2 mins 30s or less', stat: 'speed', uplift: 5, category: 'Cycling' },
  { id: 'cycle-1km-2m', title: 'Cycle 1km in 2 mins or less', stat: 'speed', uplift: 10, category: 'Cycling' },
  { id: 'cycle-2km-4m', title: 'Cycle 2km in 4 mins or less', stat: 'speed', uplift: 10, category: 'Cycling' },
  { id: 'cycle-5km-10m', title: 'Cycle 5km in 10 mins or less', stat: 'speed', uplift: 10, category: 'Cycling' },
    { id: 'cycle-5km-9m', title: 'Cycle 5km in 9 mins or less', stat: 'speed', uplift: 4, category: 'Cycling' },
  // Leg Press
  { id: 'legpress-10x30', title: 'Complete 10 reps of 30kg Leg Press', stat: 'leg_power', uplift: 3, category: 'Leg Press' },
  { id: 'legpress-10x40', title: 'Complete 10 reps of 40kg Leg Press', stat: 'leg_power', uplift: 5, category: 'Leg Press' },
  { id: 'legpress-10xbw', title: 'Complete 10 reps of bodyweight Leg Press', stat: 'leg_power', uplift: 10, category: 'Leg Press' },
  { id: 'legpress-10xbw20', title: 'Complete 10 reps of bodyweight +20kg Leg Press', stat: 'leg_power', uplift: 10, category: 'Leg Press' },
  { id: 'legpress-10xbw30', title: 'Complete 10 reps of bodyweight +30kg Leg Press', stat: 'leg_power', uplift: 20, category: 'Leg Press' },
  // Squats
  { id: 'squat-10', title: 'Complete 10 squats in one go', stat: 'leg_power', uplift: 5, category: 'Squats' },
  { id: 'squat-20', title: 'Complete 20 squats in one go', stat: 'leg_power', uplift: 7, category: 'Squats' },
  { id: 'squat-bb-20', title: 'Complete 10 reps of barbell squats with 20kg', stat: 'leg_power', uplift: 5, category: 'Squats' },
  { id: 'squat-bb-30', title: 'Complete 10 reps of barbell squats with 30kg', stat: 'leg_power', uplift: 5, category: 'Squats' },
  { id: 'squat-bb-40', title: 'Complete 10 reps of barbell squats with 40kg', stat: 'leg_power', uplift: 10, category: 'Squats' },
  { id: 'squat-bb-bw', title: 'Complete 10 reps of barbell squats + bodyweight', stat: 'leg_power', uplift: 20, category: 'Squats' },
];

const STAT_LABELS: Record<string, string> = {
  speed: 'Speed',
  stamina: 'Stamina',
  pull_strength: 'Pull Strength',
  push_strength: 'Push Strength',
  leg_power: 'Leg Power',
};

export default function Challenges() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCompleted();
  }, [user]);

  const loadCompleted = async () => {
    const { data } = await supabase
      .from('user_challenges')
      .select('challenge_id')
      .eq('user_id', user!.id);
    if (data) setCompletedIds(new Set(data.map((r) => r.challenge_id)));
    setLoading(false);
  };

  const toggleChallenge = async (challenge: Challenge) => {
    const isCompleted = completedIds.has(challenge.id);

    if (isCompleted) {
      // Remove completion record
      const { error: deleteError } = await supabase
        .from('user_challenges')
        .delete()
        .eq('user_id', user!.id)
        .eq('challenge_id', challenge.id);
      if (deleteError) return;

      // Subtract the stat uplift
      const { data: profile } = await supabase
        .from('profiles')
        .select(challenge.stat)
        .eq('user_id', user!.id)
        .single();
      if (profile) {
        const currentVal = (profile as Record<string, number>)[challenge.stat] || 1;
        const newVal = Math.max(currentVal - challenge.uplift, 1);
        await supabase
          .from('profiles')
          .update({ [challenge.stat]: newVal })
          .eq('user_id', user!.id);

        toast({
          title: 'Challenge un-completed',
          description: `${STAT_LABELS[challenge.stat]} -${challenge.uplift} (now ${newVal})`,
        });
      }

      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(challenge.id);
        return next;
      });
    } else {
      // Insert completion record
      const { error: insertError } = await supabase
        .from('user_challenges')
        .insert({ user_id: user!.id, challenge_id: challenge.id });
      if (insertError) return;

      // Get current stat value
      const { data: profile } = await supabase
        .from('profiles')
        .select(challenge.stat)
        .eq('user_id', user!.id)
        .single();
      if (!profile) return;

      const currentVal = (profile as Record<string, number>)[challenge.stat] || 1;
      const newVal = Math.min(currentVal + challenge.uplift, 100);

      await supabase
        .from('profiles')
        .update({ [challenge.stat]: newVal })
        .eq('user_id', user!.id);

      setCompletedIds((prev) => new Set([...prev, challenge.id]));

      toast({
        title: '🏆 Challenge Complete!',
        description: `${STAT_LABELS[challenge.stat]} +${challenge.uplift} (now ${newVal})`,
      });
    }
  };

  const uncompleteAll = async () => {
    if (completedIds.size === 0) return;

    // Get all completed challenges with their stat info
    const completedChallenges = CHALLENGES.filter((ch) => completedIds.has(ch.id));

    // Calculate total uplift per stat to subtract
    const statReductions: Record<string, number> = {};
    for (const ch of completedChallenges) {
      statReductions[ch.stat] = (statReductions[ch.stat] || 0) + ch.uplift;
    }

    // Delete all completion records
    const { error: deleteError } = await supabase
      .from('user_challenges')
      .delete()
      .eq('user_id', user!.id);
    if (deleteError) return;

    // Get current profile stats and subtract
    const statKeys = Object.keys(statReductions);
    if (statKeys.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(statKeys.join(','))
        .eq('user_id', user!.id)
        .single();
      if (profile) {
        const updates: Record<string, number> = {};
        for (const stat of statKeys) {
          const currentVal = (profile as unknown as Record<string, number>)[stat] || 1;
          updates[stat] = Math.max(currentVal - statReductions[stat], 1);
        }
        await supabase.from('profiles').update(updates).eq('user_id', user!.id);
      }
    }

    setCompletedIds(new Set());
    toast({
      title: 'All challenges reset',
      description: `${completedChallenges.length} challenges un-completed. Stats adjusted.`,
    });
  };

  const filteredChallenges = useMemo(() => {
    return CHALLENGES.filter((ch) => {
      if (hideCompleted && completedIds.has(ch.id)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return ch.title.toLowerCase().includes(q) || ch.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchQuery, hideCompleted, completedIds]);

  const completedCount = completedIds.size;

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
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          MY <span className="text-primary">CHALLENGES</span>
        </h1>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <span className="font-heading text-2xl font-bold text-primary text-glow">
              {completedCount}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">
              / {CHALLENGES.length} completed
            </span>
          </div>
          <div className="ml-auto">
            <div className="stat-bar-bg h-2 w-24">
              <div
                className="stat-bar-fill h-full"
                style={{ width: `${(completedCount / CHALLENGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {completedCount > 0 && (
          <button
            onClick={uncompleteAll}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Un-complete all challenges
          </button>
        )}
      </div>


      {/* Search & Filter */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            hideCompleted
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          {hideCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {hideCompleted ? 'Hidden' : 'Hide done'}
        </button>
      </div>

      {/* Challenge tiles */}
      <div className="space-y-3">
        {filteredChallenges.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No challenges found.</p>
        )}
        {filteredChallenges.map((ch) => {
          const done = completedIds.has(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => toggleChallenge(ch)}
              className={`group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                done
                  ? 'border-primary/30 bg-primary/5 hover:border-destructive/40'
                  : 'border-border bg-card hover:border-primary/40 hover:box-glow'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  done
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground group-hover:border-primary'
                }`}
              >
                {done && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {ch.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {ch.category}
                  </span>
                  <span className="text-xs text-primary">
                    +{ch.uplift} {STAT_LABELS[ch.stat]}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
