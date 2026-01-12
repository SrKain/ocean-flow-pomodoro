import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSummary {
  userId: string;
  email: string;
  displayName: string;
  totalFocusTime: number;
  cyclesCompleted: number;
  tasksCompleted: number;
  totalTasks: number;
  rating: number | null;
  topTags: { name: string; time: number }[];
}

async function sendEmail(client: SMTPClient, to: string, subject: string, html: string, fromEmail: string) {
  try {
    await client.send({
      from: fromEmail,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

function generateEmailHtml(summary: UserSummary, date: string): string {
  const taskCompletionRate = summary.totalTasks > 0 
    ? Math.round((summary.tasksCompleted / summary.totalTasks) * 100) 
    : 0;

  const ratingStars = summary.rating 
    ? "⭐".repeat(summary.rating) + "☆".repeat(5 - summary.rating)
    : "Não avaliado";

  const topTagsHtml = summary.topTags.length > 0
    ? summary.topTags.map(t => `<li>${t.name}: ${formatTime(t.time)}</li>`).join("")
    : "<li>Nenhuma tag registrada</li>";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { color: #a78bfa; margin: 0; font-size: 28px; }
        .header p { color: #9ca3af; margin-top: 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 12px; padding: 20px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #a78bfa; }
        .stat-label { color: #9ca3af; font-size: 14px; margin-top: 4px; }
        .section { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .section h3 { color: #e5e5e5; margin: 0 0 12px 0; font-size: 16px; }
        .section ul { margin: 0; padding-left: 20px; color: #9ca3af; }
        .section li { margin-bottom: 8px; }
        .rating { text-align: center; font-size: 24px; margin: 16px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Resumo do Dia</h1>
          <p>${date}</p>
        </div>
        
        <p style="color: #e5e5e5; margin-bottom: 24px;">Olá, ${summary.displayName || "Focador"}! Aqui está o resumo da sua produtividade de hoje:</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatTime(summary.totalFocusTime)}</div>
            <div class="stat-label">Tempo Total de Foco</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.cyclesCompleted}</div>
            <div class="stat-label">Ciclos Completados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.tasksCompleted}/${summary.totalTasks}</div>
            <div class="stat-label">Missões Cumpridas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${taskCompletionRate}%</div>
            <div class="stat-label">Taxa de Conclusão</div>
          </div>
        </div>
        
        <div class="section">
          <h3>🏷️ Tempo por Categoria</h3>
          <ul>
            ${topTagsHtml}
          </ul>
        </div>
        
        <div class="section">
          <h3>⭐ Avaliação do Dia</h3>
          <div class="rating">${ratingStars}</div>
        </div>
        
        <div class="footer">
          <p>Continue focando e alcançando seus objetivos!</p>
          <p>Este email foi enviado automaticamente pelo seu app de produtividade.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Daily email summary function started");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "Missing SMTP configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use UTC for date comparison since database stores in UTC
    const now = new Date();
    // Get start of today in UTC
    const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEndUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    
    // For display, use BRT (UTC-3)
    const brtOffset = -3 * 60 * 60 * 1000;
    const nowBRT = new Date(now.getTime() + brtOffset);
    const dateStr = nowBRT.toLocaleDateString("pt-BR", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      timeZone: "America/Sao_Paulo"
    });
    
    // Also get date string for queries (YYYY-MM-DD in BRT)
    const todayDateStr = `${nowBRT.getFullYear()}-${String(nowBRT.getMonth() + 1).padStart(2, '0')}-${String(nowBRT.getDate()).padStart(2, '0')}`;

    console.log(`Processing summaries for ${dateStr}`);
    console.log(`UTC range: ${todayStartUTC.toISOString()} to ${todayEndUTC.toISOString()}`);
    console.log(`BRT date string: ${todayDateStr}`);

    // Get all users with their profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("user_id, display_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Get user emails from auth
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    const userEmailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const profile of profiles || []) {
      const userId = profile.user_id;
      const email = userEmailMap.get(userId);
      
      if (!email) {
        console.log(`No email found for user ${userId}`);
        continue;
      }

      // Get today's cycles for this user (using UTC range)
      const { data: cycles, error: cyclesError } = await supabaseClient
        .from("cycle_records")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", todayStartUTC.toISOString())
        .lte("start_time", todayEndUTC.toISOString());

      console.log(`User ${userId}: Found ${cycles?.length || 0} cycles`);

      if (cyclesError) {
        console.error(`Error fetching cycles for user ${userId}:`, cyclesError);
        continue;
      }

      // Get today's tasks for this user (using BRT date)
      const { data: tasks, error: tasksError } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", todayDateStr);

      if (tasksError) {
        console.error(`Error fetching tasks for user ${userId}:`, tasksError);
        continue;
      }
      
      console.log(`User ${userId}: Found ${tasks?.length || 0} tasks`);

      // Get today's rating (using BRT date)
      const { data: ratings, error: ratingsError } = await supabaseClient
        .from("daily_ratings")
        .select("rating")
        .eq("user_id", userId)
        .eq("date", todayDateStr)
        .single();

      // Calculate focus time (only immersion and dive phases)
      let totalFocusTime = 0;
      const tagTimeMap = new Map<string, number>();

      for (const cycle of cycles || []) {
        if (cycle.phase === "immersion" || cycle.phase === "dive") {
          const start = new Date(cycle.start_time);
          const end = new Date(cycle.end_time);
          const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
          totalFocusTime += duration;

          if (cycle.tag) {
            tagTimeMap.set(cycle.tag, (tagTimeMap.get(cycle.tag) || 0) + duration);
          }
        }
      }

      const topTags = Array.from(tagTimeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, time]) => ({ name, time }));

      const summary: UserSummary = {
        userId,
        email,
        displayName: profile.display_name || "Focador",
        totalFocusTime,
        cyclesCompleted: (cycles || []).filter(c => c.completed).length,
        tasksCompleted: (tasks || []).filter(t => t.completed).length,
        totalTasks: (tasks || []).length,
        rating: ratings?.rating || null,
        topTags,
      };

      // Only send email if user had some activity
      if (summary.cyclesCompleted > 0 || summary.totalTasks > 0) {
        const html = generateEmailHtml(summary, dateStr);
        const success = await sendEmail(
          client,
          email,
          `📊 Seu Resumo de Produtividade - ${dateStr}`,
          html,
          fromEmail
        );

        if (success) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      } else {
        console.log(`Skipping email for user ${userId} - no activity today`);
      }
    }

    await client.close();

    console.log(`Email summary complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        emailsFailed,
        date: dateStr 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in daily-email-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
