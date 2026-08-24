'use client';

import { useState } from 'react';
import Script from 'next/script';
import { PlanDefinition, BILLING_PLANS, PlanKey, BillingInterval } from '@/lib/billing/plans';
import {
  createSubscriptionAction,
  createCustomerPortalAction,
  cancelSubscriptionAction,
} from '@/app/actions/billing';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Smartphone,
} from 'lucide-react';

interface BillingDashboardClientProps {
  organizationId: string;
  subscription: {
    status: string;
    interval?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    razorpay_customer_id?: string;
  };
  currentPlan: PlanDefinition;
  usage: {
    dentistsCount: number;
    websitesCount: number;
    aiMessagesCount: number;
  };
}

export default function BillingDashboardClient({
  organizationId,
  subscription,
  currentPlan,
  usage,
}: BillingDashboardClientProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const status = subscription.status || 'trialing';
  const isTrial = status === 'trialing';
  const isActive = status === 'active';
  const isPastDue = status === 'past_due';
  const isCanceled = status === 'canceled';

  const handlePortalClick = async () => {
    setLoadingAction('portal');
    setErrorMsg(null);
    try {
      const res = await createCustomerPortalAction(organizationId);
      if (res.success && res.url) {
        window.location.assign(res.url);
      } else {
        setErrorMsg(res.error || 'Failed to open billing portal');
      }
    } catch {
      setErrorMsg('An unexpected error occurred');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    setLoadingAction(`checkout-${planKey}`);
    setErrorMsg(null);
    try {
      const res = await createSubscriptionAction(organizationId, planKey, selectedInterval);
      
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to initialize checkout');
        setLoadingAction(null);
        return;
      }

      // If mock test id returned, just use the fallback URL
      if (res.subscriptionId?.startsWith('sub_test_') || res.subscriptionId?.startsWith('sub_rzp_')) {
        window.location.assign(res.url || '/dashboard/billing');
        setLoadingAction(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        subscription_id: res.subscriptionId,
        name: 'Radiant Nobel',
        description: `Subscription for ${planKey} plan`,
        handler: function () {
          window.location.reload();
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#0284c7', // sky-600
        },
      };

      type RazorpayInstance = {
        on: (event: string, handler: (res: { error: { description: string } }) => void) => void;
        open: () => void;
      };
      type RazorpayConstructor = new (options: unknown) => RazorpayInstance;

      const RazorpayClass = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
      if (RazorpayClass) {
        const rzp = new RazorpayClass(options);
        rzp.on('payment.failed', function (paymentResponse: { error: { description: string } }) {
          setErrorMsg(`Payment failed: ${paymentResponse.error.description}`);
        });
        rzp.open();
      }
    } catch {
      setErrorMsg('An unexpected error occurred');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription at the end of the current billing cycle?')) {
      return;
    }
    setLoadingAction('cancel');
    setErrorMsg(null);
    try {
      const res = await cancelSubscriptionAction(organizationId, true);
      if (res.success) {
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'Failed to cancel subscription');
      }
    } catch {
      setErrorMsg('Failed to cancel subscription');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-8 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Subscriptions</h1>
          <p className="text-sm text-slate-500">
            Manage your clinic subscription, payment methods, and monitor usage limits.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{currentPlan.name} Plan</h2>
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )}
                {isTrial && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <Clock className="w-3.5 h-3.5" /> 14-Day Free Trial
                  </span>
                )}
                {isPastDue && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5" /> Past Due
                  </span>
                )}
                {isCanceled && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Canceled
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{currentPlan.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {subscription.razorpay_customer_id && (
                <button
                  type="button"
                  onClick={handlePortalClick}
                  disabled={loadingAction === 'portal'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-all"
                >
                  {loadingAction === 'portal' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Manage Billing
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-slate-400" /> UPI (GPay, PhonePe, Paytm)
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-slate-400" /> Cards & Netbanking
            </div>
          </div>

          {/* Subscription Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Billing Cadence</span>
              <p className="text-base font-semibold text-slate-800 capitalize mt-0.5">
                {subscription.interval || 'Monthly'} (₹{currentPlan.monthlyPrice}/mo)
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Period End</span>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : '14 days remaining'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Auto-Renewal</span>
              <p className="text-base font-semibold text-slate-800 mt-0.5">
                {subscription.cancel_at_period_end ? (
                  <span className="text-amber-600 font-medium">Canceling at period end</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Enabled</span>
                )}
              </p>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="pt-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Current Usage & Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI Messages */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">AI Conversations</span>
                  <span className="font-bold text-slate-900">
                    {usage.aiMessagesCount} / {currentPlan.limits.aiMessagesLimit >= 10000 ? 'Unlimited' : currentPlan.limits.aiMessagesLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.aiMessagesCount / (currentPlan.limits.aiMessagesLimit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dentists */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Dentists & Staff</span>
                  <span className="font-bold text-slate-900">
                    {usage.dentistsCount} / {currentPlan.limits.dentistsLimit >= 100 ? 'Unlimited' : currentPlan.limits.dentistsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.dentistsCount / (currentPlan.limits.dentistsLimit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Websites */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Connected Sites</span>
                  <span className="font-bold text-slate-900">
                    {usage.websitesCount} / {currentPlan.limits.websitesLimit >= 10 ? 'Unlimited' : currentPlan.limits.websitesLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.websitesCount / (currentPlan.limits.websitesLimit || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection / Upgrade Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upgrade or Change Plan</h2>
              <p className="text-sm text-slate-500">Select a plan tier that fits your expanding practice.</p>
            </div>

            <div className="bg-slate-200 p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setSelectedInterval('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedInterval === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterval('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedInterval === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Yearly (2 Mo Free)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(BILLING_PLANS).map((plan) => {
              const isCurrent = plan.key === currentPlan.key;
              const price = selectedInterval === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

              return (
                <div
                  key={plan.key}
                  className={`bg-white border rounded-2xl p-6 flex flex-col justify-between ${
                    isCurrent ? 'border-sky-600 ring-2 ring-sky-600/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-xs bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
                    <div className="text-2xl font-extrabold text-slate-900 mb-4">
                      ₹{price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                      {plan.highlights.slice(0, 5).map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-default"
                      >
                        Active Plan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={loadingAction === `checkout-${plan.key}`}
                        className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        {loadingAction === `checkout-${plan.key}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        Switch to {plan.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancellation / Danger Zone */}
        {isActive && !subscription.cancel_at_period_end && (
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-rose-900">Cancel Subscription</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Your subscription and AI receptionist features will remain active until the end of the billing period.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loadingAction === 'cancel'}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all"
            >
              {loadingAction === 'cancel' ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
