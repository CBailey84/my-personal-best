import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AvatarSelector from '@/components/AvatarSelector';
import StatsCard from '@/components/StatsCard';
import { LogOut, Save } from 'lucide-react';

interface ProfileData {
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

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', height_cm: '', weight_kg: '', avatar_id: 'avatar-1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('name, age, height_cm, weight_kg, avatar_id, speed, stamina, pull_strength, push_strength, leg_power')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setProfile(data as ProfileData);
      setForm({
        name: data.name || '',
        age: data.age?.toString() || '',
        height_cm: data.height_cm?.toString() || '',
        weight_kg: data.weight_kg?.toString() || '',
        avatar_id: data.avatar_id || 'avatar-1',
      });
      // Show edit form if profile is incomplete
      if (!data.name) setEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        name: form.name || null,
        age: form.age ? parseInt(form.age) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        avatar_id: form.avatar_id,
      })
      .eq('user_id', user!.id);

    await loadProfile();
    setEditing(false);
    setSaving(false);
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          MY <span className="text-primary">PROFILE</span>
        </h1>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              Edit
            </button>
          )}
          <button
            onClick={signOut}
            className="rounded-lg border border-border bg-secondary p-1.5 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <StatsCard profile={profile} />

      {/* Edit Form */}
      {editing && (
        <div className="mt-6 animate-slide-up space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading text-lg font-semibold text-foreground">Edit Details</h3>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Avatar</label>
            <AvatarSelector selected={form.avatar_id} onSelect={(id) => setForm({ ...form, avatar_id: id })} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Height (cm)</label>
              <input
                type="number"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Weight (kg)</label>
              <input
                type="number"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-heading font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}
    </div>
  );
}
