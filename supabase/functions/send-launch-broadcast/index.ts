import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BroadcastRequest {
  campaignId: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as BroadcastRequest;
    if (!body.campaignId) {
      return new Response(
        JSON.stringify({ error: "campaignId é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load campaign
    const { data: campaignRow, error: campErr } = await supabase
      .from("ebook_launch_campaigns")
      .select("id, ebook_id, subject, message, channel, status, sent_count")
      .eq("id", body.campaignId)
      .maybeSingle();

    if (campErr || !campaignRow) {
      return new Response(
        JSON.stringify({ error: "Campanha não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const campaign = campaignRow as {
      id: string;
      ebook_id: string;
      subject: string;
      message: string;
      channel: string;
      status: string;
      sent_count: number;
    };

    // 2. Load all subscribers
    const { data: subsData, error: subsErr } = await supabase
      .from("ebook_launch_subscribers")
      .select("id, email, name")
      .order("created_at", { ascending: true });

    if (subsErr) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar assinantes." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subscribers = (subsData as Subscriber[]) ?? [];
    if (subscribers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum assinante para enviar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Load email gateway settings
    const { data: settingsRow } = await supabase
      .from("store_settings")
      .select("email_gateway_enabled, resend_api_key, email_from_name, email_from_address, store_name")
      .eq("id", 1)
      .maybeSingle();

    const s = settingsRow as {
      email_gateway_enabled: boolean | null;
      resend_api_key: string | null;
      email_from_name: string | null;
      email_from_address: string | null;
      store_name: string | null;
    } | null;

    // 4. Send emails via Resend (only email channel for now)
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    if (campaign.channel === "email") {
      if (!s?.email_gateway_enabled || !s?.resend_api_key) {
        // Gateway not configured — record as queued (not actually sent)
        for (const sub of subscribers) {
          await supabase.from("automation_runs").insert({
            automation_id: null,
            trigger_type: "new_offer",
            recipient_email: sub.email,
            customer_name: sub.name,
            status: "queued",
            payload: {
              campaign_id: campaign.id,
              ebook_id: campaign.ebook_id,
              subject: campaign.subject,
              message: campaign.message,
              channel: campaign.channel,
              note: "Gateway de e-mail não configurado. Configure em Configurações > E-mail.",
            },
          });
        }
        return new Response(
          JSON.stringify({
            sent: 0,
            total: subscribers.length,
            queued: subscribers.length,
            warning: "Gateway de e-mail não configurado. As mensagens ficaram na fila. Configure o envio em Configurações da Loja > E-mail de Disparo.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const fromName = s.email_from_name ?? s.store_name ?? "João Art's";
      const fromAddress = s.email_from_address ?? "contato@joaoarts.com.br";
      const fromField = `${fromName} <${fromAddress}>`;

      for (const sub of subscribers) {
        try {
          const sendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${s.resend_api_key}`,
            },
            body: JSON.stringify({
              from: fromField,
              to: sub.email,
              subject: campaign.subject,
              text: campaign.message,
            }),
          });

          if (sendRes.ok) {
            sentCount++;
            await supabase.from("automation_runs").insert({
              automation_id: null,
              trigger_type: "new_offer",
              recipient_email: sub.email,
              customer_name: sub.name,
              status: "sent",
              payload: {
                campaign_id: campaign.id,
                ebook_id: campaign.ebook_id,
                subject: campaign.subject,
                channel: campaign.channel,
              },
            });
          } else {
            failedCount++;
            const errBody = await sendRes.text();
            errors.push(`${sub.email}: ${errBody.slice(0, 200)}`);
            await supabase.from("automation_runs").insert({
              automation_id: null,
              trigger_type: "new_offer",
              recipient_email: sub.email,
              customer_name: sub.name,
              status: "failed",
              payload: {
                campaign_id: campaign.id,
                ebook_id: campaign.ebook_id,
                subject: campaign.subject,
                channel: campaign.channel,
                error: errBody.slice(0, 500),
              },
            });
          }
        } catch (err) {
          failedCount++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errors.push(`${sub.email}: ${errMsg}`);
          await supabase.from("automation_runs").insert({
            automation_id: null,
            trigger_type: "new_offer",
            recipient_email: sub.email,
            customer_name: sub.name,
            status: "failed",
            payload: {
              campaign_id: campaign.id,
              ebook_id: campaign.ebook_id,
              subject: campaign.subject,
              channel: campaign.channel,
              error: errMsg.slice(0, 500),
            },
          });
        }
      }
    } else {
      // WhatsApp / SMS — recorded as queued (needs separate gateway)
      for (const sub of subscribers) {
        await supabase.from("automation_runs").insert({
          automation_id: null,
          trigger_type: "new_offer",
          recipient_email: campaign.channel === "email" ? sub.email : null,
          customer_name: sub.name,
          status: "queued",
          payload: {
            campaign_id: campaign.id,
            ebook_id: campaign.ebook_id,
            subject: campaign.subject,
            message: campaign.message,
            channel: campaign.channel,
            note: `Canal ${campaign.channel} requer gateway separado.`,
          },
        });
      }
      return new Response(
        JSON.stringify({
          sent: 0,
          total: subscribers.length,
          queued: subscribers.length,
          warning: `Canal ${campaign.channel} ainda não tem gateway configurado. As mensagens foram registradas na fila.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. Update campaign status
    await supabase
      .from("ebook_launch_campaigns")
      .update({
        status: "sent",
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return new Response(
      JSON.stringify({
        sent: sentCount,
        failed: failedCount,
        total: subscribers.length,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
