'use client';

import { useState } from 'react';
import { verifyInstallation } from '@/app/actions/website';
import { CheckCircle, AlertCircle, Copy, Code, Layout, Globe, Box } from 'lucide-react';

export default function WebsiteIntegration() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Mocking the loaded data
  const widgetId = "widget-1234-abcd";
  const url = "https://www.smileclinic.com";
  const [isVerified, setIsVerified] = useState(false);

  const jsSnippet = `<script src="https://dentalai.test/widget.js" data-widget-id="${widgetId}" defer></script>`;
  const iframeSnippet = `<iframe src="https://dentalai.test/widget?id=${widgetId}" width="100%" height="600" style="border:none;"></iframe>`;

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    const result = await verifyInstallation(widgetId, url);
    setVerificationResult(result);
    if (result.success) {
      setIsVerified(true);
    }
    setIsVerifying(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Website Integration</h1>

      {/* Status Card */}
      <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Registered URL</p>
            <p className="font-medium text-slate-900">{url}</p>
          </div>
          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" /> Unverified
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={handleVerify} 
          disabled={isVerifying || isVerified}
          className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {isVerifying ? 'Checking...' : isVerified ? 'Successfully Connected' : 'Verify Installation'}
        </button>

        {verificationResult && !verificationResult.success && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{verificationResult.error}</p>
          </div>
        )}
      </div>

      {/* Installation Options */}
      <h2 className="text-lg font-semibold mb-4">Installation Methods</h2>
      
      <div className="space-y-6">
        {/* Method 1: JS */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">1. Standard JavaScript (Recommended)</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Copy and paste this snippet just before the closing <code>&lt;/body&gt;</code> tag on your website.</p>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-sm overflow-x-auto">
              <code>{jsSnippet}</code>
            </pre>
            <button onClick={() => copyToClipboard(jsSnippet)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Method 2: iframe */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">2. Fallback Iframe</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">If your CMS blocks custom JavaScript, use this secure iframe to embed the booking engine directly on a page.</p>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-sm overflow-x-auto">
              <code>{iframeSnippet}</code>
            </pre>
            <button onClick={() => copyToClipboard(iframeSnippet)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CMS Helpers */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer">
            <Box className="w-8 h-8 text-slate-700 mb-2" />
            <h4 className="font-medium text-sm">WordPress Plugin</h4>
            <p className="text-xs text-slate-500 mt-1">Download our official WP plugin for 1-click install.</p>
          </div>
          <div className="bg-white border rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer">
            <Globe className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-medium text-sm">Google Tag Manager</h4>
            <p className="text-xs text-slate-500 mt-1">View instructions for adding the snippet via GTM.</p>
          </div>
          <div className="bg-white border rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer">
            <Code className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-sm">Developer API</h4>
            <p className="text-xs text-slate-500 mt-1">Read the docs for custom integration & webhooks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
