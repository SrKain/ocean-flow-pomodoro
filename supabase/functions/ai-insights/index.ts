import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { period = 7 } = await req.json();

    // Get cycle records for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const { data: cycles, error: cyclesError } = await supabaseClient
      .from("cycle_records")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", startDate.toISOString())
      .order("start_time", { ascending: false });

    if (cyclesError) {
      console.error("Error fetching cycles:", cyclesError);
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tasks for the period
    const { data: tasks } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString());

    // Calculate statistics
    const completedDives = cycles?.filter(c => c.phase === "dive" && c.completed) || [];
    const completedBreaths = cycles?.filter(c => c.phase === "breath" && c.completed) || [];
    const skippedCycles = cycles?.filter(c => !c.completed) || [];
    
    const totalFocusMinutes = completedDives.reduce((acc, c) => {
      const duration = (new Date(c.end_time).getTime() - new Date(c.start_time).getTime()) / 60000;
      return acc + duration;
    }, 0);

    const avgRating = completedBreaths.filter(c => c.rating).reduce((acc, c, _, arr) => {
      return acc + (c.rating || 0) / arr.length;
    }, 0);

    // Get tag distribution
    const tagCounts: Record<string, number> = {};
    completedDives.forEach(c => {
      if (c.tag) {
        tagCounts[c.tag] = (tagCounts[c.tag] || 0) + 1;
      }
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate daily patterns
    const hourlyDistribution: Record<number, number> = {};
    completedDives.forEach(c => {
      const hour = new Date(c.start_time).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Music correlation
    const withMusic = completedBreaths.filter(c => c.spotify_track_name && c.rating);
    const withoutMusic = completedBreaths.filter(c => !c.spotify_track_name && c.rating);
    const avgWithMusic = withMusic.length > 0 
      ? withMusic.reduce((acc, c) => acc + (c.rating || 0), 0) / withMusic.length 
      : 0;
    const avgWithoutMusic = withoutMusic.length > 0 
      ? withoutMusic.reduce((acc, c) => acc + (c.rating || 0), 0) / withoutMusic.length 
      : 0;

    // Prepare context for AI
    const context = {
      period,
      totalCycles: completedDives.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      avgRating: avgRating.toFixed(1),
      skippedCount: skippedCycles.length,
      topTags,
      peakHour: peakHour ? `${peakHour}h` : null,
      musicImpact: avgWithMusic > 0 && avgWithoutMusic > 0 
        ? { withMusic: avgWithMusic.toFixed(1), withoutMusic: avgWithoutMusic.toFixed(1) }
        : null,
      tasksCompleted: tasks?.filter(t => t.completed).length || 0,
      totalTasks: tasks?.length || 0,
    };

    // Call Lovable AI for insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um coach de produtividade especializado em técnicas de foco profundo (deep work).
Analise os dados do usuário e forneça insights práticos e motivacionais em português brasileiro.
Seja direto, positivo e dê sugestões acionáveis.
Limite sua resposta a 3-4 frases curtas e impactantes.
Use emojis com moderação para tornar a mensagem mais amigável.`
          },
          {
            role: "user",
            content: `Aqui estão meus dados de foco dos últimos ${period} dias:
- Ciclos de foco completados: ${context.totalCycles}
- Tempo total de foco: ${context.totalFocusMinutes} minutos
- Avaliação média: ${context.avgRating}/5 estrelas
- Ciclos pulados: ${context.skippedCount}
- Tags mais usadas: ${context.topTags.map(t => t.tag).join(', ') || 'nenhuma'}
- Horário de pico: ${context.peakHour || 'indefinido'}
${context.musicImpact ? `- Nota com música: ${context.musicImpact.withMusic}, sem música: ${context.musicImpact.withoutMusic}` : ''}
- Missões: ${context.tasksCompleted}/${context.totalTasks} concluídas

Me dê insights sobre meus hábitos de foco e como posso melhorar.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const insight = aiData.choices?.[0]?.message?.content || "Não foi possível gerar insights no momento.";

    return new Response(JSON.stringify({ 
      insight,
      stats: context 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-insights:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
