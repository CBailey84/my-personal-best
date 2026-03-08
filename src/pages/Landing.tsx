import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import heroRunner from '@/assets/hero-runner.jpg';
import heroBiker from '@/assets/hero-biker.jpg';
import heroBench from '@/assets/hero-bench.jpg';
import { Zap, Target, Trophy } from 'lucide-react';

const slides = [
  { image: heroRunner, label: 'Run Faster' },
  { image: heroBiker, label: 'Ride Harder' },
  { image: heroBench, label: 'Lift Stronger' },
];

export default function Landing() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      const { error: authError } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        navigate('/profile');
      }
    } catch {
      setError('Something went wrong');
    }
    setAuthLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background slideshow */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: activeSlide === i ? 1 : 0 }}
        >
          <img src={slide.image} alt={slide.label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      ))}

      {/* Slide indicators */}
      <div className="absolute bottom-32 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`h-2 rounded-full transition-all ${
              activeSlide === i ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/40'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-2 font-heading text-6xl font-bold tracking-tight text-foreground md:text-8xl">
          PERSONAL <span className="text-primary text-glow">BEST</span>
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Set goals. Crush workouts. Beat your records.
        </p>

        {/* Feature pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {[
            { icon: Target, label: 'Set Goals' },
            { icon: Zap, label: 'Track Workouts' },
            { icon: Trophy, label: 'Beat PBs' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-foreground backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>

        {!showAuth ? (
          <button
            onClick={() => setShowAuth(true)}
            className="rounded-lg bg-primary px-8 py-3 font-heading text-lg font-semibold text-primary-foreground transition-all hover:scale-105 box-glow animate-pulse-glow"
          >
            GET STARTED
          </button>
        ) : (
          <div className="w-full max-w-sm animate-slide-up rounded-xl border border-border bg-card/90 p-6 backdrop-blur-md">
            <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {authLoading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="mt-3 text-sm text-muted-foreground hover:text-primary"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
