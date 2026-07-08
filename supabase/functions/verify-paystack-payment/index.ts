// Supabase Edge Function: verify-paystack-payment
//
// This runs on Supabase's servers, NOT in the browser. The Paystack secret
// key lives only here, as an Edge Function secret — it is never sent to or
// readable by the client.
//
// Flow:
//   1. Client completes the Paystack popup and gets a `reference`.
//   2. Client calls this function with { reference, plan }.
//   3. This function asks Paystack's API "did this transaction really
//      succeed?" using the secret key.
//   4. Only if Paystack confirms success do we update the user's plan
//      in the database.
//
// Deploy with:
//   supabase functions deploy verify-paystack-payment
//
// Set the secret (do this once, from your terminal, NOT in any committed file):
//   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx

import { createClient } from 'npm:@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ALLOWED_PLANS = ['pro', 'premium'] as const;
type AllowedPlan = typeof ALLOWED_PLANS[number];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not configured.');
    return jsonResponse({ error: 'Server is not configured for payments.' }, 500);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase service credentials are not configured.');
    return jsonResponse({ error: 'Server misconfiguration.' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401);
    }

    const { reference, plan } = await req.json();

    if (!reference || typeof reference !== 'string') {
      return jsonResponse({ error: 'Missing or invalid transaction reference.' }, 400);
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return jsonResponse({ error: 'Invalid plan requested.' }, 400);
    }

    // Identify the calling user from their Supabase auth token.
    const supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabaseAuthClient.auth.getUser();

    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Could not authenticate user.' }, 401);
    }

    const userId = userData.user.id;

    // Ask Paystack directly whether this transaction actually succeeded.
    // This is the step that requires the secret key, and the entire reason
    // this logic cannot live in the browser.
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error('Paystack verify request failed:', verifyResponse.status);
      return jsonResponse({ error: 'Could not verify transaction with Paystack.' }, 502);
    }

    const verifyResult = await verifyResponse.json();
    const transaction = verifyResult?.data;

    const paymentSucceeded = verifyResult?.status === true && transaction?.status === 'success';

    if (!paymentSucceeded) {
      return jsonResponse(
        { error: 'Transaction was not successful.', paystackStatus: transaction?.status ?? 'unknown' },
        402
      );
    }

    // Defense in depth: confirm the amount actually matches what the plan
    // should cost, so a client can't pay for a cheap plan and request an
    // upgrade to an expensive one using a valid-but-mismatched reference.
    const expectedAmountInKobo = PLAN_PRICES_ZAR_KOBO[plan as AllowedPlan];
    if (transaction.amount !== expectedAmountInKobo) {
      console.warn(
        `Amount mismatch for user ${userId}: paid ${transaction.amount}, expected ${expectedAmountInKobo} for plan ${plan}`
      );
      return jsonResponse({ error: 'Payment amount does not match the requested plan.' }, 402);
    }

    // Payment is genuinely confirmed — now update the user's plan using the
    // service role client (bypasses RLS, since this is a trusted server context).
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user plan:', updateError);
      return jsonResponse({ error: 'Payment verified, but failed to update account. Contact support.' }, 500);
    }

    return jsonResponse({ success: true, plan });
  } catch (err) {
    console.error('Unexpected error in verify-paystack-payment:', err);
    return jsonResponse({ error: 'Unexpected server error.' }, 500);
  }
});

// Prices in kobo (smallest ZAR unit) — adjust to your actual pricing.
// Keeping this server-side means the client can never dictate its own price.
const PLAN_PRICES_ZAR_KOBO: Record<AllowedPlan, number> = {
  pro: 14900,    // e.g. R149.00
  premium: 29900, // e.g. R299.00
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
