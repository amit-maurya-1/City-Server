// ============================================================
// CityServe — Edge Function: Admin Registration Validation
// Path: supabase/functions/register-admin/index.ts
//
// Deploy with: supabase functions deploy register-admin
//
// WHY THIS EXISTS:
// VITE_ env vars are bundled into the JS bundle — anyone can
// read them in DevTools. Admin secret must be validated
// server-side, never on the frontend.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, city_id, secret_code } = await req.json();

    // --- Input validation ---
    if (!email || !password || !full_name || !city_id || !secret_code) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Validate admin secret code (server-side only) ---
    const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET_CODE");
    if (!ADMIN_SECRET) {
      console.error("ADMIN_SECRET_CODE env variable not set.");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (secret_code !== ADMIN_SECRET) {
      // Intentionally vague — don't tell them the code is wrong specifically
      return new Response(
        JSON.stringify({ error: "Invalid admin secret code." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Create user with service role client (bypasses RLS for admin creation) ---
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // skip email verification for admins
      user_metadata: {
        full_name,
        city_id,
        role: "admin",
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Profile is auto-created by the on_auth_user_created trigger
    // (reads role and city_id from user_metadata)

    return new Response(
      JSON.stringify({
        message: "Admin account created successfully.",
        user_id: authData.user?.id,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
