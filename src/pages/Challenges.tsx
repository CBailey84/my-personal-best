import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Check, Trophy, Search, EyeOff, Eye } from 'lucide-react';
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
  { id: 'pushup-10', title: 'Complete 10 push ups in one go', stat: 'push_strength', uplift: 1, category: 'Push Ups' },
  { id: 'pushup-15', title: 'Complete 15 push ups in one go', stat: 'push_strength', uplift: 2, category: 'Push Ups' },
  { id: 'pushup-20', title: 'Complete 20 push ups in one go', stat: 'push_strength', uplift: 3, category: 'Push Ups' },
  { id: 'pushup-30', title: 'Complete 30 push ups in one go', stat: 'push_strength', uplift: 5, category: 'Push Ups' },
  // Running (stamina)
  { id: 'run-5k', title: 'Complete a 5km run', stat: 'stamina', uplift: 1, category: 'Running' },
  { id: 'run-10k', title: 'Complete a 10km run', stat: 'stamina', uplift: 3, category: 'Running' },
  { id: 'run-20k', title: 'Complete a 20km run', stat: 'stamina', uplift: 5, category: 'Running' },
  // Biking
  { id: 'bike-10k', title: 'Complete a 10km bike ride', stat: 'stamina', uplift: 1, category: 'Biking' },
  { id: 'bike-20k', title: 'Complete a 20km bike ride', stat: 'stamina', uplift: 2, category: 'Biking' },
  { id: 'bike-50k', title: 'Complete a 50km bike ride', stat: 'stamina', uplift: 5, category: 'Biking' },
  // Bench press
  { id: 'bench-10x20', title: 'Bench press 10 reps of 20kg', stat: 'push_strength', uplift: 1, category: 'Bench Press' },
  { id: 'bench-1xbw', title: 'Bench press 1 rep at bodyweight', stat: 'push_strength', uplift: 3, category: 'Bench Press' },
  { id: 'bench-2xbw', title: 'Bench press 2 reps at bodyweight', stat: 'push_strength', uplift: 5, category: 'Bench Press' },
  // Pull ups
  { id: 'pullup-3', title: 'Complete 3 pull ups in one go', stat: 'pull_strength', uplift: 1, category: 'Pull Ups' },
  { id: 'pullup-5', title: 'Complete 5 pull ups in one go', stat: 'pull_strength', uplift: 2, category: 'Pull Ups' },
  { id: 'pullup-10', title: 'Complete 10 pull ups in one go', stat: 'pull_strength', uplift: 5, category: 'Pull Ups' },
  // Speed
  { id: 'sprint-20s', title: 'Run 100m in 20 seconds or less', stat: 'speed', uplift: 1, category: 'Sprints' },
  { id: 'sprint-16s', title: 'Run 100m in 16 seconds or less', stat: 'speed', uplift: 2, category: 'Sprints' },
  { id: 'sprint-14s', title: 'Run 100m in 14 seconds or less', stat: 'speed', uplift: 5, category: 'Sprints' },
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

  const completeChallenge = async (challenge: Challenge) => {
    if (completedIds.has(challenge.id)) return;

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
    const newVal = Math.min(currentVal + challenge.uplift, 99);

    // Update the stat
    await supabase
      .from('profiles')
      .update({ [challenge.stat]: newVal })
      .eq('user_id', user!.id);

    setCompletedIds((prev) => new Set([...prev, challenge.id]));

    toast({
      title: '🏆 Challenge Complete!',
      description: `${STAT_LABELS[challenge.stat]} +${challenge.uplift} (now ${newVal})`,
    });
  };

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
      </div>

      {/* Challenge tiles */}
      <div className="space-y-3">
        {CHALLENGES.map((ch) => {
          const done = completedIds.has(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => completeChallenge(ch)}
              disabled={done}
              className={`group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                done
                  ? 'border-border/50 bg-muted/30 opacity-50'
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
