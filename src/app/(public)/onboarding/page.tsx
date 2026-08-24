import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to DentalAI</h1>
        <p className="text-slate-600 mt-2">Let&apos;s get your clinic set up in just a few steps.</p>
      </div>
      <OnboardingFlow />
    </div>
  );
}
