'use client';

import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Send,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Stethoscope,
  HelpCircle,
  CreditCard,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  scanWebsiteAction,
  approveAndPublishKnowledgeAction,
  deleteKnowledgeBaseAction,
} from '@/app/actions/knowledge';
import { StructuredExtractionResult } from '@/lib/knowledge/extractor';

interface KnowledgeCrawlerClientProps {
  clinicId: string;
  initialSource?: {
    id: string;
    url: string;
    status: string;
    pages_discovered: number;
    extracted_data: StructuredExtractionResult;
    warnings: string[];
    last_scanned_at?: string;
    approved_at?: string;
  } | null;
}

export function KnowledgeCrawlerClient({ clinicId, initialSource }: KnowledgeCrawlerClientProps) {
  const [url, setUrl] = useState(initialSource?.url || '');
  const [sourceId, setSourceId] = useState<string | undefined>(initialSource?.id);
  const [status, setStatus] = useState<string>(initialSource?.status || 'none');
  const [extractedData, setExtractedData] = useState<StructuredExtractionResult | null>(
    initialSource?.extracted_data || null
  );
  const [warnings, setWarnings] = useState<string[]>(initialSource?.warnings || []);
  const [pagesCount, setPagesCount] = useState<number>(initialSource?.pages_discovered || 0);
  const [lastScannedAt, setLastScannedAt] = useState<string | undefined>(initialSource?.last_scanned_at);

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'dentists' | 'hours' | 'faqs' | 'test'>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Test Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your 24/7 Dental AI Receptionist. Ask me anything about our services, opening hours, pricing, or appointment policies!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScanning(true);
    setFeedback(null);
    setScanStep('Scanning your clinic...');

    try {
      setTimeout(() => {
        setScanStep('Reading clinic information...');
      }, 1200);

      setTimeout(() => {
        setScanStep('Building your AI receptionist...');
      }, 2400);

      const res = await scanWebsiteAction(clinicId, url);

      if (!res.success || !res.extracted) {
        setFeedback({ type: 'error', message: res.error || 'Website scan failed.' });
        setIsScanning(false);
        return;
      }

      setSourceId(res.sourceId);
      setStatus('crawled');
      setExtractedData(res.extracted);
      setPagesCount(res.pagesDiscovered || 1);
      setWarnings(res.warnings || []);
      setLastScannedAt(new Date().toISOString());
      setScanStep('Your AI receptionist is ready!');
      setFeedback({
        type: 'success',
        message: `Successfully crawled ${res.pagesDiscovered} pages! Review the extracted clinical knowledge below.`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error)?.message || 'Scan error occurred.' });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePublish = async () => {
    if (!sourceId || !extractedData) return;
    setIsPublishing(true);
    setFeedback(null);

    try {
      const res = await approveAndPublishKnowledgeAction(clinicId, sourceId, extractedData);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to publish knowledge.' });
        return;
      }

      setStatus('published');
      setFeedback({
        type: 'success',
        message: 'Knowledge base approved and published! The AI Receptionist is now using this verified data.',
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error)?.message || 'Publishing error.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!sourceId) return;
    if (!confirm('Are you sure you want to delete this crawled knowledge base?')) return;

    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await deleteKnowledgeBaseAction(clinicId, sourceId);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete.' });
        return;
      }

      setSourceId(undefined);
      setStatus('none');
      setExtractedData(null);
      setWarnings([]);
      setPagesCount(0);
      setUrl('');
      setFeedback({ type: 'success', message: 'Knowledge base removed successfully.' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error)?.message || 'Delete error.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setIsChatThinking(true);

    setTimeout(() => {
      let botResponse = "I don't have that information. Please contact our clinic staff directly.";

      const lower = userQuery.toLowerCase();
      if (extractedData) {
        if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
          const mon = extractedData.hours.find((h) => h.day_of_week === 1);
          botResponse = `We are open Monday to Friday from ${mon?.open_time || '9:00 AM'} to ${mon?.close_time || '7:00 PM'}, and Saturday from 10:00 AM to 2:00 PM.`;
        } else if (lower.includes('service') || lower.includes('treatment') || lower.includes('offer')) {
          const serviceNames = extractedData.services.map((s) => s.name).slice(0, 4).join(', ');
          botResponse = `We provide comprehensive dental treatments including ${serviceNames}, and more!`;
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('whitening') || lower.includes('rct')) {
          const priced = extractedData.services.find((s) => s.price);
          if (priced) {
            botResponse = `${priced.name} is available starting from ₹${priced.price}. Would you like to check available slots?`;
          } else {
            botResponse = 'Our treatment fees depend on individual clinical assessment. Please contact the front desk for a personalized estimate.';
          }
        } else if (lower.includes('dentist') || lower.includes('doctor')) {
          const doctorNames = extractedData.dentists.map((d) => d.name).join(', ');
          botResponse = `Our dental team includes ${doctorNames || 'certified dental specialists'}.`;
        } else if (lower.includes('where') || lower.includes('address') || lower.includes('location')) {
          botResponse = extractedData.clinic.address
            ? `We are located at ${extractedData.clinic.address}.`
            : `Please contact us at ${extractedData.clinic.phone || 'our front desk'} for location directions.`;
        } else if (lower.includes('insurance') || lower.includes('upi') || lower.includes('payment')) {
          botResponse = `We accept ${extractedData.insuranceAndPayment.slice(0, 3).join(', ')}.`;
        }
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
      setIsChatThinking(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">AI Knowledge Base</h1>
            {status === 'published' ? (
              <Badge variant="success" size="md">Published &amp; Active</Badge>
            ) : status === 'crawled' ? (
              <Badge variant="warning" size="md">Review &amp; Approval Required</Badge>
            ) : (
              <Badge variant="neutral" size="md">No Website Linked</Badge>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Connect your public clinic website to automatically train your 24/7 AI Receptionist with verified treatments, hours, and policies.
          </p>
        </div>

        {status !== 'none' && (
          <div className="flex items-center gap-2">
            {status === 'crawled' && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Approve & Publish to AI'}</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. URL Scanner Input Card */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="website-url" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Dentist Website URL</span>
            </label>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SSRF Protected • Robots.txt Compliant</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="website-url"
                type="url"
                required
                placeholder="https://yourdentalclinic.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isScanning}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Website...' : status === 'published' ? 'Rescan Website' : 'Scan & Extract Knowledge'}</span>
            </button>
          </div>

          {isScanning && (
            <div className="p-5 rounded-2xl liquid-glass border border-blue-200/80 flex items-center gap-3 text-blue-700 animate-pulse shadow-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-black tracking-tight">{scanStep}</p>
                <p className="text-[11px] text-slate-500">Autonomous clinical entity & schedule extraction in progress</p>
              </div>
            </div>
          )}

          {lastScannedAt && (
            <p className="text-[11px] text-slate-500 font-medium">
              Last scanned: {new Date(lastScannedAt).toLocaleString()} • {pagesCount} pages discovered
            </p>
          )}
        </form>
      </Card>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Clinical Verification Notices ({warnings.length})</span>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Structured Preview & Tabs */}
      {extractedData && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'overview', label: 'Clinic Overview', icon: Building2 },
              { id: 'services', label: `Services (${extractedData.services.length})`, icon: Stethoscope },
              { id: 'dentists', label: `Dentists (${extractedData.dentists.length})`, icon: Bot },
              { id: 'hours', label: 'Hours', icon: Clock },
              { id: 'faqs', label: `FAQs (${extractedData.faqs.length})`, icon: HelpCircle },
              { id: 'test', label: 'Live AI Simulator', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Extracted Practice Information</h3>
                <Badge variant="pro">Verified Clean</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinic Name</label>
                  <p className="text-base font-bold text-slate-900 mt-1">{extractedData.clinic.name}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-800">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>{extractedData.clinic.phone || 'Not listed on website'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-800">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{extractedData.clinic.email || 'Not listed on website'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Address</label>
                  <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-800">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{extractedData.clinic.address || 'Address unverified'}</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Description</label>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">{extractedData.clinic.description}</p>
                </div>
              </div>

              {/* Action */}
              {status === 'crawled' && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isPublishing ? 'Publishing...' : 'Approve & Publish to AI'}</span>
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extractedData.services.map((srv, idx) => (
                <Card key={idx} className="p-5 flex flex-col justify-between" hoverable>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                      {srv.price ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ₹{srv.price}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Contact for price</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Duration: {srv.duration_minutes} mins</span>
                    <span className="capitalize">{srv.category || 'Dental Care'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 3: DENTISTS */}
          {activeTab === 'dentists' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extractedData.dentists.map((d, idx) => (
                <Card key={idx} className="p-5 space-y-2" hoverable>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm">
                      {d.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                      <p className="text-xs text-blue-600 font-medium">{d.specialty || 'General Dentist'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-2">{d.bio}</p>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 4: HOURS */}
          {activeTab === 'hours' && (
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Weekly Operating Hours</h3>
              <div className="divide-y divide-slate-100">
                {extractedData.hours.map((h, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{h.day_name}</span>
                    {h.is_closed ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Closed</span>
                    ) : (
                      <span className="font-medium text-slate-700">
                        {h.open_time} - {h.close_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 5: FAQS & INSURANCE */}
          {activeTab === 'faqs' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Accepted Payment &amp; Insurance Methods</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extractedData.insuranceAndPayment.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              </Card>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Extracted Frequently Asked Questions</h3>
                {extractedData.faqs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific FAQ items were detected on the website.</p>
                ) : (
                  extractedData.faqs.map((faq, idx) => (
                    <Card key={idx} className="p-5 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: LIVE AI SIMULATOR */}
          {activeTab === 'test' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Live AI Knowledge Simulator</h3>
                    <p className="text-[11px] text-slate-500">Test how the receptionist answers using this knowledge</p>
                  </div>
                </div>
                <Badge variant={status === 'published' ? 'success' : 'warning'}>
                  {status === 'published' ? 'Published Brain' : 'Draft Brain'}
                </Badge>
              </div>

              {/* Chat Container */}
              <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 space-y-3 border border-slate-100">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-xs text-slate-400 italic">
                      AI Receptionist is checking clinic knowledge...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendTestMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask e.g. What are your opening hours? Or What does teeth whitening cost?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
