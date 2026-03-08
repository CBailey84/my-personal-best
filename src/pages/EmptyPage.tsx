import { Construction } from 'lucide-react';

interface EmptyPageProps {
  title: string;
  description?: string;
}

export default function EmptyPage({ title, description }: EmptyPageProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <Construction className="mb-4 h-12 w-12 text-primary/40" />
      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">
        {description || 'Coming soon. This feature is under construction.'}
      </p>
    </div>
  );
}
