'use client';

import React, { useState, useRef } from 'react';
import { AllowedAssetType } from '@/lib/storage/validator';
import { uploadAssetAction } from '@/app/actions/upload';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface SecureImageUploadProps {
  organizationId: string;
  assetType?: AllowedAssetType;
  label?: string;
  initialImageUrl?: string;
  onUploadSuccess?: (url: string) => void;
}

export default function SecureImageUpload({
  organizationId,
  assetType = 'clinic_image',
  label = 'Upload Image',
  initialImageUrl,
  onUploadSuccess,
}: SecureImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(false);

    // Client-side quick checks
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Please select a valid JPG, PNG, or WebP image.');
      return;
    }

    const maxSize = assetType === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(`File exceeds ${assetType === 'logo' ? '2MB' : '5MB'} size limit.`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('organizationId', organizationId);
      formData.append('assetType', assetType);
      formData.append('file', file);

      const res = await uploadAssetAction(formData);

      if (res.success && res.asset) {
        setPreviewUrl(res.asset.publicUrl);
        setSuccessMsg(true);
        if (onUploadSuccess) {
          onUploadSuccess(res.asset.publicUrl);
        }
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        setErrorMsg(res.error || 'Failed to upload image.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 uppercase">
        {label}
      </label>

      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
        )}

        <div className="space-y-1.5 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`file-input-${assetType}`}
          />
          <label
            htmlFor={`file-input-${assetType}`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            )}
            {uploading ? 'Validating & Uploading...' : 'Choose File'}
          </label>

          <p className="text-[11px] text-slate-400">
            JPG, PNG, or WebP. Max {assetType === 'logo' ? '2MB' : '5MB'}.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs text-rose-600 flex items-center gap-1.5 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="text-xs text-emerald-600 flex items-center gap-1.5 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Upload verified and saved securely!</span>
        </div>
      )}
    </div>
  );
}
