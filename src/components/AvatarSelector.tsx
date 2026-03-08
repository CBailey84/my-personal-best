import avatarRunner from '@/assets/avatar-runner.png';
import avatarBiker from '@/assets/avatar-biker.png';
import avatarBench from '@/assets/avatar-bench.png';
import avatarCurls from '@/assets/avatar-curls.png';
import avatarGymnast from '@/assets/avatar-gymnast.png';

const AVATARS = [
  { id: 'avatar-1', src: avatarRunner, label: 'Runner' },
  { id: 'avatar-2', src: avatarBiker, label: 'Biker' },
  { id: 'avatar-3', src: avatarBench, label: 'Bench Press' },
  { id: 'avatar-4', src: avatarCurls, label: 'Bicep Curls' },
  { id: 'avatar-5', src: avatarGymnast, label: 'Gymnast' },
];

export function getAvatarSrc(id: string) {
  return AVATARS.find(a => a.id === id)?.src ?? avatarRunner;
}

/** @deprecated Use getAvatarSrc instead */
export function getAvatarEmoji(id: string) {
  return '';
}

interface AvatarSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 overflow-hidden transition-all ${
            selected === avatar.id
              ? 'border-primary box-glow scale-110'
              : 'border-border bg-secondary hover:border-primary/50'
          }`}
        >
          <img src={avatar.src} alt={avatar.label} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
