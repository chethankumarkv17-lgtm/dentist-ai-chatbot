'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveStep1, saveStep2, savePathA, savePathB, completeOnboarding } from '@/app/actions/onboarding';

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [hasWebsite, setHasWebsite] = useState<'yes' | 'no' | null>(null);

  // Resume state from localStorage on mount (mocking DB resume)
  useEffect(() => {
    const saved = localStorage.getItem('onboardingState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.step) setStep(parsed.step);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.hasWebsite !== undefined) setHasWebsite(parsed.hasWebsite);
    }
  }, []);

  const updateState = (newStep: number, extra?: { hasWebsite?: 'yes' | 'no' }) => {
    setStep(newStep);
    if (extra?.hasWebsite) setHasWebsite(extra.hasWebsite);
    localStorage.setItem('onboardingState', JSON.stringify({
      step: newStep,
      hasWebsite: extra?.hasWebsite || hasWebsite
    }));
  };

  const handleStep1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveStep1(formData);
      if (res.success) {
        updateState(2);
      } else {
        setError(JSON.stringify(res.errors));
      }
    });
  };

  const handleStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveStep2(formData);
      if (res.success) {
        updateState(3, { hasWebsite: res.hasWebsite });
      } else {
        setError(JSON.stringify(res.errors));
      }
    });
  };

  const handleStep3PathA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await savePathA(formData);
      if (res.success) {
        const finalize = await completeOnboarding();
        if (finalize.success) router.push('/dashboard');
      } else {
        setError(JSON.stringify(res.errors));
      }
    });
  };

  const handleStep3PathB = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await savePathB(formData);
      if (res.success) {
        const finalize = await completeOnboarding();
        if (finalize.success) router.push('/dashboard');
      } else {
        setError(JSON.stringify(res.errors));
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Step {step} of 3</h2>
        <div className="w-full bg-slate-200 h-2 mt-4 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleStep1} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Clinic Information</h3>
          <input name="name" placeholder="Clinic Name" required className="border p-2 rounded" />
          <input name="phone" placeholder="Phone Number" required className="border p-2 rounded" />
          <input name="email" type="email" placeholder="Clinic Email" required className="border p-2 rounded" />
          <input name="address" placeholder="Address" required className="border p-2 rounded" />
          <select name="timezone" required className="border p-2 rounded">
            <option value="">Select Timezone</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
          <textarea name="description" placeholder="Description (Optional)" className="border p-2 rounded" />
          <button disabled={isPending} type="submit" className="bg-blue-600 text-white p-2 rounded mt-4">
            {isPending ? 'Saving...' : 'Next Step'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Do you already have a website?</h3>
          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2 border p-4 rounded cursor-pointer hover:bg-slate-50 flex-1">
              <input type="radio" name="hasWebsite" value="yes" required />
              <span>Yes, I already have a website</span>
            </label>
            <label className="flex items-center gap-2 border p-4 rounded cursor-pointer hover:bg-slate-50 flex-1">
              <input type="radio" name="hasWebsite" value="no" required />
              <span>No, I need a website</span>
            </label>
          </div>
          <div className="flex gap-4 mt-4">
            <button type="button" onClick={() => updateState(1)} className="border p-2 rounded flex-1">Back</button>
            <button disabled={isPending} type="submit" className="bg-blue-600 text-white p-2 rounded flex-1">
              {isPending ? 'Saving...' : 'Next Step'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && hasWebsite === 'yes' && (
        <form onSubmit={handleStep3PathA} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Connect Your Existing Website</h3>
          <p className="text-sm text-slate-600">Enter your website URL so we can generate your integration snippet.</p>
          <input name="websiteUrl" type="url" placeholder="https://www.myclinic.com" required className="border p-2 rounded" />
          
          <div className="flex gap-4 mt-4">
            <button type="button" onClick={() => updateState(2)} className="border p-2 rounded flex-1">Back</button>
            <button disabled={isPending} type="submit" className="bg-blue-600 text-white p-2 rounded flex-1">
              {isPending ? 'Completing...' : 'Finish Setup'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && hasWebsite === 'no' && (
        <form onSubmit={handleStep3PathB} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Let&apos;s build your website</h3>
          <textarea name="clinicInfo" placeholder="Tell us about your clinic..." required className="border p-2 rounded" />
          <input name="services" placeholder="Services (e.g. Cleaning, Whitening)" required className="border p-2 rounded" />
          <input name="dentists" placeholder="Dentists (e.g. Dr. Smith)" required className="border p-2 rounded" />
          <input name="hours" placeholder="Hours (e.g. Mon-Fri 9am-5pm)" required className="border p-2 rounded" />
          <input name="branding" placeholder="Brand Color (e.g. #007BFF)" required className="border p-2 rounded" />
          <input name="desiredSiteName" placeholder="Desired Site Name" required className="border p-2 rounded" />
          <input name="domainPreference" placeholder="Preferred Domain (e.g. myclinic.com)" required className="border p-2 rounded" />
          
          <div className="flex gap-4 mt-4">
            <button type="button" onClick={() => updateState(2)} className="border p-2 rounded flex-1">Back</button>
            <button disabled={isPending} type="submit" className="bg-blue-600 text-white p-2 rounded flex-1">
              {isPending ? 'Building...' : 'Finish Setup'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
