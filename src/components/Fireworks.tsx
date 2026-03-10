import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
}

const COLORS = [
  'hsl(174, 72%, 46%)',
  'hsl(38, 92%, 50%)',
  'hsl(45, 93%, 58%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 72%, 60%)',
  'hsl(200, 80%, 55%)',
];

function createBurst(cx: number, cy: number, startId: number): Particle[] {
  const particles: Particle[] = [];
  const count = 18;
  for (let i = 0; i < count; i++) {
    particles.push({
      id: startId + i,
      x: cx,
      y: cy,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: (360 / count) * i + (Math.random() * 20 - 10),
      speed: 2 + Math.random() * 4,
      size: 3 + Math.random() * 4,
    });
  }
  return particles;
}

export default function Fireworks({ duration = 3000, onDone }: { duration?: number; onDone?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    let id = 0;
    const bursts = [
      { x: 30, y: 30, delay: 0 },
      { x: 70, y: 25, delay: 300 },
      { x: 50, y: 40, delay: 600 },
      { x: 20, y: 50, delay: 900 },
      { x: 80, y: 45, delay: 1100 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    bursts.forEach((b) => {
      timers.push(
        setTimeout(() => {
          setParticles((prev) => [...prev, ...createBurst(b.x, b.y, id)]);
          id += 20;
        }, b.delay)
      );
    });

    const cleanup = setTimeout(() => {
      onDone?.();
    }, duration);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animation: `firework-particle ${0.8 + Math.random() * 0.6}s ease-out forwards`,
            ['--fw-tx' as string]: `${Math.cos((p.angle * Math.PI) / 180) * p.speed * 25}px`,
            ['--fw-ty' as string]: `${Math.sin((p.angle * Math.PI) / 180) * p.speed * 25}px`,
          }}
        />
      ))}
    </div>
  );
}
