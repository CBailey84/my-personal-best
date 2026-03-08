const AVATARS = [
  { id: 'avatar-1', emoji: '🧑‍💪', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-2', emoji: '🏃', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-3', emoji: '🚴', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-4', emoji: '🏋️', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-5', emoji: '🧘', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-6', emoji: '🤸', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-7', emoji: '⛹️', bg: 'from-primary/30 to-primary/10' },
  { id: 'avatar-8', emoji: '🥊', bg: 'from-primary/30 to-primary/10' },
];

export function getAvatarEmoji(id: string) {
  return AVATARS.find(a => a.id === id)?.emoji ?? '🧑‍💪';
}

interface AvatarSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-gradient-to-br text-3xl transition-all ${
            selected === avatar.id
              ? 'border-primary box-glow scale-110 ' + avatar.bg
              : 'border-border bg-secondary hover:border-primary/50'
          }`}
        >
          {avatar.emoji}
        </button>
      ))}
    </div>
  );
}
