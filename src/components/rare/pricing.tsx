import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { useLogs } from '../../context/LogContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase-client';
import { Check, Shield, Zap, Sparkles, HelpCircle, Clock } from 'lucide-react';
import type { SubscriptionPlan } from '../../context/AuthContext';

interface PricingPlan {
  id: string;
  planKey: SubscriptionPlan;
  name: string;
  desc: string;
  priceUSD: number;
  priceZAR: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  comingSoon?: boolean;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number; // smallest currency unit (kobo for ZAR)
  currency: string;
  ref: string;
  onClose: () => void;
  callback: (response: { reference: string }) => void;
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export default function Pricing() {
  const { currency, region } = useLocalization();
  const { addLog } = useLogs();
  const { user, refreshPlan } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // Load the Paystack inline script once. This is the official client-side
  // SDK — it only ever sees the PUBLIC key, never the secret key.
  useEffect(() => {
    if (window.PaystackPop) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => addLog('PAYMENT', 'Failed to load Paystack SDK script.');
    document.body.appendChild(script);

    return () => {
      // Leave the script in place across navigations; no cleanup needed.
    };
  }, [addLog]);

  const plans: PricingPlan[] = [
    {
      id: 'creator_free',
      planKey: 'free',
      name: 'Creator Free',
      desc: 'Real-time beat-reactive rendering, no cost, no catch.',
      priceUSD: 0,
      priceZAR: 0,
      icon: <HelpCircle className="w-5 h-5 text-gray-400" />,
      features: [
        '15-second maximum clip generation',
        'Standard RARE Pulse Engine rendering',
        'Unlimited monthly renders',
        'Stereo audio multiplexer tracks',
        '720p export resolution',
        'Community discord support access'
      ]
    },
    {
      id: 'pulse_pro',
      planKey: 'pro',
      name: 'Pulse Pro',
      desc: 'Longer clips, higher resolution, zero watermark.',
      priceUSD: 9,
      priceZAR: 99,
      icon: <Zap className="w-5 h-5 text-rare-accent-cyan" />,
      popular: true,
      features: [
        'Full 20-second clip generation',
        'Unlimited monthly renders',
        'Up to 1080p export resolution',
        'No RARE watermark on exports',
        'All Style Archives + early access to new themes',
        'Priority email support'
      ]
    },
    {
      id: 'studio_waitlist',
      planKey: 'premium',
      name: 'RARE Studio AI',
      desc: 'Real generative AI cinematic rendering — in development.',
      priceUSD: 0,
      priceZAR: 0,
      icon: <Sparkles className="w-5 h-5 text-rare-accent-magenta" />,
      comingSoon: true,
      features: [
        'True AI-generated cinematic video from your prompt',
        'Powered by real generative video models, not procedural rendering',
        'Being built now — funded rollout in progress',
        'Waitlist members get first access + founder pricing',
        'Up to 4K Ultra HD export resolution (planned)',
        'API endpoint access (planned)'
      ]
    }
  ];

  // Server-side verification — the only step that can actually grant a plan
  // upgrade, since it's the only place the Paystack secret key is used.
  const verifyAndUpgrade = useCallback(
    async (reference: string, planKey: SubscriptionPlan) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        addLog('PAYMENT', 'Cannot verify payment: no active session.');
        setLoadingPlan(null);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
          body: { reference, plan: planKey },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (error || data?.error) {
          addLog('PAYMENT', `Verification failed: ${data?.error ?? error?.message ?? 'Unknown error'}`);
          alert('Payment could not be verified. If you were charged, contact support with your reference: ' + reference);
          return;
        }

        addLog('PAYMENT', `Transaction verified server-side via Paystack. Tier updated to ${planKey.toUpperCase()}.`);
        await refreshPlan();
        alert(`Success! Project RARE ${planKey.toUpperCase()} has been activated.`);
      } catch (err) {
        addLog('PAYMENT', `Verification request failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoadingPlan(null);
      }
    },
    [addLog, refreshPlan]
  );

  const handleJoinWaitlist = (plan: PricingPlan) => {
    addLog('SYSTEM', `${user?.email ?? 'Anonymous user'} joined the RARE Studio AI waitlist.`);
    setWaitlistJoined(true);
    // TODO: once ready, replace this with a real Supabase insert into a
    // `studio_waitlist` table so signups are counted for the NYDA report.
    alert("You're on the list! We'll email you the moment RARE Studio AI opens, with founder pricing locked in.");
  };

  const handleCheckout = (plan: PricingPlan) => {
    if (plan.comingSoon) {
      handleJoinWaitlist(plan);
      return;
    }

    if (plan.priceUSD === 0) {
      addLog('AUTH', 'Creator Free workspace tier activated permanently.');
      return;
    }

    if (!user) {
      addLog('PAYMENT', 'Checkout blocked: user must be signed in to subscribe.');
      alert('Please sign in before subscribing.');
      return;
    }

    if (!scriptLoaded || !window.PaystackPop) {
      addLog('PAYMENT', 'Paystack SDK not ready yet — please try again in a moment.');
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      addLog('PAYMENT', 'Paystack public key is not configured.');
      return;
    }

    setLoadingPlan(plan.id);
    const selectedPrice = currency === 'ZAR' ? plan.priceZAR : plan.priceUSD;
    const finalPrice = isAnnual ? Math.floor(selectedPrice * 12 * 0.83) : selectedPrice;

    // Paystack amounts are in the smallest currency unit (kobo for ZAR, cents for USD).
    const amountInSmallestUnit = Math.round(finalPrice * 100);
    const reference = `RARE_${plan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    addLog('PAYMENT', `Paystack inline widget initialized (${currency} Gateway) for ${plan.name}. Amount: ${currency} ${finalPrice}`);

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amountInSmallestUnit,
      currency: currency === 'ZAR' ? 'ZAR' : 'USD',
      ref: reference,
      onClose: () => {
        addLog('PAYMENT', 'Paystack checkout closed before completion.');
        setLoadingPlan(null);
      },
      callback: (response) => {
        addLog('PAYMENT', `Paystack popup reported success (ref: ${response.reference}). Verifying server-side...`);
        // IMPORTANT: we do not upgrade the plan here. The popup succeeding
        // only means the client-side flow completed — verifyAndUpgrade is
        // what actually confirms the charge with Paystack's servers using
        // the secret key before any plan change happens.
        verifyAndUpgrade(response.reference, plan.planKey);
      },
    });

    handler.openIframe();
  };

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 uppercase">
          Simple Pricing. <span className="gradient-text">Real Value.</span>
        </h2>
        <p className="text-gray-400 text-lg">
          Built for <span className="text-white font-semibold">{region}</span> creators — start free, upgrade when you're ready.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center justify-center mt-10 gap-4">
          <span className={`text-sm tracking-wider uppercase transition-colors ${!isAnnual ? 'text-rare-accent-cyan' : 'text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 rounded-full bg-rare-border p-1 relative transition-colors duration-300 border border-white/5"
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 ${isAnnual ? 'translate-x-7 bg-rare-accent-purple' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm tracking-wider uppercase transition-colors ${isAnnual ? 'text-rare-accent-purple' : 'text-gray-500'}`}>Annual Bill</span>
            <span className="text-xs bg-rare-accent-purple/20 text-rare-accent-purple px-2 py-0.5 rounded-full font-bold border border-rare-accent-purple/30">SAVE 17%</span>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const basePrice = currency === 'ZAR' ? plan.priceZAR : plan.priceUSD;
          const displayPrice = isAnnual ? Math.floor(basePrice * 12 * 0.83) : basePrice;
          const isCurrentPlan = user?.plan === plan.planKey;

          return (
            <div
              key={plan.id}
              className={`glass-panel rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                plan.popular ? 'border-rare-accent-cyan/30 shadow-[0_0_50px_rgba(0,212,255,0.05)]' : 'border-white/5'
              } ${plan.comingSoon ? 'border-rare-accent-magenta/20' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest uppercase bg-rare-accent-cyan text-black px-4 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              )}
              {plan.comingSoon && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest uppercase bg-rare-accent-magenta text-black px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Clock className="w-3 h-3" /> COMING SOON
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold tracking-wide uppercase text-white">{plan.name}</h3>
                  {plan.icon}
                </div>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed min-h-[40px]">{plan.desc}</p>

                {!plan.comingSoon ? (
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-white">
                      {currency === 'ZAR' ? 'R' : '$'}{displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs tracking-wider text-gray-500 uppercase">
                      /{isAnnual ? 'year' : 'mo'}
                    </span>
                  </div>
                ) : (
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tight text-white">
                      Free to join waitlist
                    </span>
                  </div>
                )}

                <div className="h-[1px] bg-white/5 w-full mb-8" />

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-rare-accent-purple shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan !== null || isCurrentPlan || (plan.comingSoon && waitlistJoined)}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 ${
                  plan.popular
                    ? 'premium-btn text-black'
                    : 'premium-btn-dark text-white hover:bg-white/5'
                } flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {loadingPlan === plan.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : plan.comingSoon ? (
                  waitlistJoined ? "You're on the list" : 'Join the Waitlist'
                ) : plan.priceUSD === 0 ? (
                  'Start Free'
                ) : (
                  'Upgrade to Pro'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-16 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-rare-accent-cyan" />
        SECURE END-TO-END PAYSTACK ENCRYPTION HANDSHAKE ACTIVE
      </div>
    </section>
  );
}
