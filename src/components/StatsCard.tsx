import { getAvatarEmoji } from './AvatarSelector';

interface Profile {
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_id: string;
  speed: number;
  stamina: number;
  pull_strength: number;
  push_strength: number;
  leg_power: number;
}

interface StatsCardProps {
  profile: Profile;
}

const stats = [
  { key: 'speed' as const, label: 'Speed', color: 'bg-primary' },
  { key: 'stamina' as const, label: 'Stamina', color: 'bg-primary' },
  { key: 'pull_strength' as const, label: 'Pull Strength', color: 'bg-primary' },
  { key: 'push_strength' as const, label: 'Push Strength', color: 'bg-primary' },
  { key: 'leg_power' as const, label: 'Leg Power', color: 'bg-primary' },
];

export default function StatsCard({ profile }: StatsCardProps) {
  const overallRating = Math.round(
    (profile.speed + profile.stamina + profile.pull_strength + profile.push_strength + profile.leg_power) / 5
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-secondary p-5 box-glow">
      {/* Decorative corner accent */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

      {/* Header row */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-secondary text-5xl">
          {getAvatarEmoji(profile.avatar_id)}
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {profile.name || 'New Athlete'}
          </h2>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile.age && <span>Age: {profile.age}</span>}
            {profile.height_cm && <span>{profile.height_cm}cm</span>}
            {profile.weight_kg && <span>{profile.weight_kg}kg</span>}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-heading text-3xl font-bold text-primary text-glow">
            {overallRating}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">OVR</span>
        </div>
      </div>

      {/* Stats bars */}
      <div className="space-y-3">
        {stats.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 text-xs font-medium text-muted-foreground">{label}</span>
            <div className="stat-bar-bg h-2 flex-1">
              <div
                className="stat-bar-fill h-full"
                style={{ width: `${profile[key]}%` }}
              />
            </div>
            <span className="w-8 text-right font-heading text-sm font-semibold text-foreground">
              {profile[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
