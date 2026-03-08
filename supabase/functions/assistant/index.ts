import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { messages } = await req.json();

    // Fetch all user data in parallel
    const [profileRes, goalsRes, workoutsRes, pbRes, challengesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("workouts").select("*").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(50),
      supabase.from("personal_bests").select("*").eq("user_id", user.id),
      supabase.from("user_challenges").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const goals = goalsRes.data || [];
    const workouts = workoutsRes.data || [];
    const pbs = pbRes.data || [];
    const challenges = challengesRes.data || [];

    const systemPrompt = `You are an expert personal trainer and fitness coach called "Coach". You have access to the user's fitness data and should use it to give personalised, actionable advice.

Keep responses concise, motivating, and practical. Use markdown formatting for clarity. Address the user by name if available.

## User Profile
${profile ? `Name: ${profile.name || "Not set"}, Age: ${profile.age || "N/A"}, Height: ${profile.height_cm || "N/A"}cm, Weight: ${profile.weight_kg || "N/A"}kg
Stats (1-10): Speed ${profile.speed}, Stamina ${profile.stamina}, Push ${profile.push_strength}, Pull ${profile.pull_strength}, Legs ${profile.leg_power}` : "No profile data yet."}

## Current Goals (${goals.length})
${goals.length > 0 ? goals.map(g => `- ${g.workout_type}: ${g.target_value} ${g.target_unit}${g.secondary_value ? ` / ${g.secondary_value} ${g.secondary_unit}` : ""} ${g.completed ? "✅ COMPLETED" : "⏳ In progress"}`).join("\n") : "No goals set."}

## Recent Workouts (last 50)
${workouts.length > 0 ? workouts.slice(0, 20).map(w => `- ${w.workout_date}: ${w.workout_type} ${w.target_value}${w.target_unit} → ${w.result_value}${w.result_unit}`).join("\n") : "No workouts logged yet."}

## Personal Bests (${pbs.length})
${pbs.length > 0 ? pbs.map(p => `- ${p.workout_type} ${p.target_value}${p.target_unit}: ${p.result_value}${p.result_unit}`).join("\n") : "No personal bests yet."}

## Completed Challenges (${challenges.length})
${challenges.length > 0 ? challenges.map(c => `- ${c.challenge_id} on ${c.completed_at}`).join("\n") : "No challenges completed yet."}

Based on this data, provide guidance on training, recovery, goal setting, and performance improvement. If the user hasn't logged much data, encourage them to start tracking.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
