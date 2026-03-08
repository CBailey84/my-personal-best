import { useLocation, useNavigate } from 'react-router-dom';
import { User, Target, Zap, Dumbbell, Trophy, Bot } from 'lucide-react';

const navItems = [
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/challenges', icon: Zap, label: 'Challenges' },
  { path: '/workout', icon: Dumbbell, label: 'Workout' },
  { path: '/pb', icon: Trophy, label: 'PB' },
  { path: '/assistant', icon: Bot, label: 'Assistant' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-glow' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
