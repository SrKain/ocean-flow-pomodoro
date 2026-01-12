import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateResetEmailHtml(resetLink: string): string {
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
        .content { text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px; }
        .link { color: #a78bfa; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 OceanFlow</h1>
        </div>
        
        <div class="content">
          <h2 style="color: #e5e5e5;">Redefinir Senha</h2>
          <p style="color: #9ca3af;">Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          
          <a href="${resetLink}" class="button">Redefinir Senha</a>
          
          <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
          <p class="link">${resetLink}</p>
        </div>
        
        <div class="footer">
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          <p>Este link expira em 1 hora.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send reset email function started");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate password reset link
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://d842d11c-388d-4c88-b347-fe90382d060b.lovable.app"}/auth?reset=true`,
      },
    });

    if (error) {
      console.error("Error generating reset link:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = data.properties?.action_link;
    
    if (!resetLink) {
      return new Response(
        JSON.stringify({ error: "No reset link generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via SMTP
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

    const html = generateResetEmailHtml(resetLink);

    await client.send({
      from: fromEmail,
      to: email,
      subject: "🔐 Redefinir sua senha - OceanFlow",
      content: "auto",
      html: html,
    });

    await client.close();

    console.log(`Reset email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-reset-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
