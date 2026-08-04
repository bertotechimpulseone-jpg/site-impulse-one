// Recebe o diagnóstico do site iimpulseone.com.br e grava em public.leads
// Usa service role (a tabela leads só permite acesso autenticado, então o site
// nunca fala direto com o banco).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ORIGENS_OK = new Set([
  "https://iimpulseone.com.br",
  "https://www.iimpulseone.com.br",
  "http://localhost:4716",
]);

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ORIGENS_OK.has(origin) ? origin : "https://iimpulseone.com.br",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const limpa = (v: unknown, max = 180) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors(origin) });

  try {
    const b = await req.json();

    // armadilha anti-robô: campo invisível preenchido = descarta em silêncio
    if (limpa(b.empresa_site)) return new Response(JSON.stringify({ ok: true }), { headers: { ...cors(origin), "content-type": "application/json" } });

    const nome = limpa(b.nome, 120);
    const email = limpa(b.email, 160).toLowerCase();
    const whatsapp = limpa(b.whatsapp, 40);
    const cargo = limpa(b.cargo, 80);
    const faturamento = limpa(b.faturamento, 80);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    const foneOk = whatsapp.replace(/\D/g, "").length >= 10;
    if (!nome || !emailOk || !foneOk) {
      return new Response(JSON.stringify({ ok: false, erro: "dados incompletos" }), {
        status: 400, headers: { ...cors(origin), "content-type": "application/json" },
      });
    }

    const prioridade = /acima/i.test(faturamento) ? "high" : /200/.test(faturamento) ? "med" : "low";

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { error } = await db.from("leads").insert({
      name: nome,
      contact_name: nome,
      email,
      phone: whatsapp,
      stage: "lead",
      priority: prioridade,
      observacoes: [
        "Diagnóstico gratuito pelo site",
        cargo && `Cargo: ${cargo}`,
        faturamento && `Faturamento mensal: ${faturamento}`,
      ].filter(Boolean).join(" · "),
    });

    if (error) {
      console.error("insert falhou:", error.message);
      return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { ...cors(origin), "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors(origin), "content-type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { ...cors(origin), "content-type": "application/json" } });
  }
});
