import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Layers,
  Smartphone,
  RefreshCw,
  Watch,
  Tablet,
  Headphones,
  Zap,
  ShieldCheck,
  Cpu,
  Package,
  Gamepad2,
} from 'lucide-react';
import { BRAND_PRESETS, CATEGORY_PRESETS, BrandPreset, CategoryPreset } from '../lib/brand-assets.ts';

interface IconImageUploaderProps {
  type: 'brand' | 'category';
  currentValue: string;
  name: string;
  token: string;
  onChange: (newValue: string) => void;
  onNameAutoFill?: (presetName: string) => void;
  className?: string;
}

export const IconImageUploader: React.FC<IconImageUploaderProps> = ({
  type,
  currentValue,
  name,
  token,
  onChange,
  onNameAutoFill,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(
    currentValue && (currentValue.startsWith('http') || currentValue.startsWith('/')) ? currentValue : ''
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Helper to optimize and square any uploaded image to 1:1 aspect ratio
  const optimizeAndSquareImage = (file: File): Promise<{ dataUrl: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      // SVG files are vectors - preserve crisp vector markup directly
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, mimeType: 'image/svg+xml' });
        reader.onerror = () => reject(new Error('Failed to read SVG file'));
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const targetDimension = 512; // Ideal 1:1 square canvas resolution
        canvas.width = targetDimension;
        canvas.height = targetDimension;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result as string, mimeType: file.type || 'image/jpeg' });
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(file);
          return;
        }

        // Clean transparent canvas
        ctx.clearRect(0, 0, targetDimension, targetDimension);

        // Center and contain image to guarantee perfect 1:1 square aspect ratio without distortion
        const aspect = img.width / img.height;
        let drawWidth = targetDimension;
        let drawHeight = targetDimension;
        let offsetX = 0;
        let offsetY = 0;

        if (aspect > 1) {
          // Wider than tall
          drawWidth = targetDimension;
          drawHeight = Math.round(targetDimension / aspect);
          offsetY = Math.round((targetDimension - drawHeight) / 2);
        } else {
          // Taller than wide or square
          drawHeight = targetDimension;
          drawWidth = Math.round(targetDimension * aspect);
          offsetX = Math.round((targetDimension - drawWidth) / 2);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Export as PNG for transparency support, WebP if supported
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outMime = isPng ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(outMime, 0.88);
        resolve({ dataUrl, mimeType: outMime });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, mimeType: file.type || 'image/jpeg' });
        reader.onerror = () => reject(new Error('Invalid image file format'));
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please choose a smaller file.');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    try {
      // 1. Process and square image to 1:1 ratio
      const { dataUrl, mimeType } = await optimizeAndSquareImage(file);

      // 2. Attempt server persistent upload
      let appliedUrl = dataUrl;
      let isServerPersisted = false;

      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fileName: file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/png' ? '.png' : '.webp'),
            mimeType: mimeType,
            data: dataUrl,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            appliedUrl = data.url;
            isServerPersisted = true;
          }
        }
      } catch (networkErr) {
        console.warn('Backend image upload note, using optimized square direct emblem:', networkErr);
      }

      // 3. Apply image immediately (never leave user blocked)
      onChange(appliedUrl);
      setCustomUrlInput(appliedUrl.startsWith('data:') ? '1:1 Optimized Square Emblem' : appliedUrl);

      if (isServerPersisted) {
        setUploadSuccess('Image auto-squared to 1:1 ratio & securely saved to database!');
      } else {
        setUploadSuccess('Image auto-squared to 1:1 ratio & applied successfully!');
      }
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error('Image upload error:', err);
      setUploadError(err.message || 'Image processing failed. Please select a valid PNG or JPG.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleApplyUrl = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (customUrlInput.trim()) {
      onChange(customUrlInput.trim());
      setUploadSuccess('Image URL applied successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  // Render system Lucide icon helper for Category
  const renderLucideCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5" />;
      case 'Watch':
        return <Watch className="w-5 h-5" />;
      case 'Tablet':
        return <Tablet className="w-5 h-5" />;
      case 'Headphones':
        return <Headphones className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const isImageOrDataUri =
    currentValue &&
    (currentValue.startsWith('/') ||
      currentValue.startsWith('http') ||
      currentValue.startsWith('data:image'));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live Emblem Preview Card */}
      <div className="p-4 rounded-2xl bg-[#151419] border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Emblem Frame */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className={`overflow-hidden transition-all duration-300 flex items-center justify-center bg-[#242129] relative shadow-lg ${
              type === 'brand'
                ? 'w-18 h-18 rounded-full border-2 border-[#B7F34B] shadow-[0_0_15px_rgba(183,243,75,0.3)]'
                : 'w-18 h-18 rounded-2xl border-2 border-[#922CB5] shadow-[0_0_15px_rgba(146,44,181,0.3)] text-[#B7F34B]'
            }`}
          >
            {isImageOrDataUri ? (
              <img
                src={currentValue}
                alt={name || 'Preview'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback on image load error
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : type === 'category' ? (
              renderLucideCategoryIcon(currentValue || 'Smartphone')
            ) : (
              <span className="text-2xl font-black text-[#B7F34B] font-mono">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            Live Preview
          </span>
        </div>

        {/* Info & State */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold text-white">
              {name || (type === 'brand' ? 'Brand Emblem' : 'Category Icon')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#B7F34B]/15 text-[#B7F34B] border border-[#B7F34B]/30">
              {isImageOrDataUri ? 'Custom Graphic' : 'System Icon'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 max-w-md">
            {type === 'brand'
              ? 'This emblem appears in the public brand filter carousel, device specifications, and product badges.'
              : 'This icon or badge appears in the category navigation bar and catalogue filtering grid.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {currentValue && (
              <button
                type="button"
                onClick={() => {
                  onChange(type === 'brand' ? '' : 'Smartphone');
                  setCustomUrlInput('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 text-xs font-semibold border border-white/10 hover:border-rose-500/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            )}

            {currentValue && (
              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px] sm:max-w-xs block">
                {currentValue.startsWith('data:') ? 'Embedded SVG Emblem' : currentValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Method Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-[#B7F34B] text-black shadow-sm'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preset')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preset'
              ? 'bg-[#922CB5] text-white shadow-sm'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{type === 'brand' ? '1-Click Brand Badges' : 'System & Preset Icons'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Image URL</span>
        </button>
      </div>

      {/* TAB 1: Drag-and-Drop Image File Uploader */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-[#B7F34B] bg-[#B7F34B]/10 shadow-[0_0_20px_rgba(183,243,75,0.2)]'
              : 'border-white/15 bg-[#151419] hover:border-white/30 hover:bg-[#1a1820]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              uploading ? 'bg-[#922CB5]/30 text-[#B7F34B]' : 'bg-white/5 text-[#B7F34B]'
            }`}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#B7F34B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-white block group-hover:text-[#B7F34B] transition-colors">
              {uploading
                ? 'Squaring to 1:1 & Saving to Database...'
                : 'Click to select or drag & drop emblem image here'}
            </span>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-[#B7F34B]/20 text-[#B7F34B] text-[10px] font-black uppercase tracking-wider border border-[#B7F34B]/40">
                Required Ratio: 1:1 Square
              </span>
              <span className="text-[10px] text-zinc-400">
                (e.g., 500×500 px or 400×400 px)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              <span className="text-emerald-400 font-semibold">⚡ Auto-Squaring:</span> Wide or tall images are automatically centered and fitted into a crisp 1:1 square canvas • PNG, SVG, WebP, JPG
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: 1-Click Presets */}
      {activeTab === 'preset' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {type === 'brand' ? 'Official Brand Badges' : 'Certified Category Icons'}
            </span>
            <span className="text-[10px] text-zinc-500">Click to select instantly</span>
          </div>

          {type === 'brand' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {BRAND_PRESETS.map((preset: BrandPreset) => {
                const isSelected = currentValue === preset.url;
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setCustomUrlInput(preset.url);
                      if (onNameAutoFill && (!name || name.trim() === '')) {
                        onNameAutoFill(preset.name);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#922CB5]/40 to-[#B7F34B]/20 border-[#B7F34B] shadow-md scale-102'
                        : 'bg-[#151419] border-white/5 hover:border-white/20 hover:bg-[#1f1d24]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#242129] flex items-center justify-center">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">
                        {preset.name}
                      </span>
                      {preset.tagline && (
                        <span className="text-[9px] text-zinc-400 block truncate">
                          {preset.tagline}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lucide System Icons for Category */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { name: 'Smartphone', label: 'Mobile' },
                  { name: 'Tablet', label: 'Tablets' },
                  { name: 'Watch', label: 'Watches' },
                  { name: 'Headphones', label: 'Audio' },
                  { name: 'Zap', label: 'Power & Cables' },
                  { name: 'ShieldCheck', label: 'Accessories' },
                  { name: 'RefreshCw', label: 'Refurbished' },
                  { name: 'Gamepad2', label: 'Gaming' },
                  { name: 'Cpu', label: 'Components' },
                  { name: 'Package', label: 'General' },
                ].map((item) => {
                  const isSelected = currentValue === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onChange(item.name);
                        setCustomUrlInput('');
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#922CB5] border-[#B7F34B] text-white shadow-md'
                          : 'bg-[#151419] border-white/5 text-zinc-300 hover:border-white/20 hover:bg-[#1a1820]'
                      }`}
                    >
                      <div className={isSelected ? 'text-white' : 'text-[#B7F34B]'}>
                        {renderLucideCategoryIcon(item.name)}
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Direct URL */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
            Public Image URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleApplyUrl(e);
                }
              }}
              placeholder="https://example.com/logo.png"
              className="flex-1 bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2 rounded-xl bg-[#B7F34B] hover:bg-[#a5e03e] text-black font-black text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">
            Ensure the image is hosted on a CORS-accessible server or CDN.
          </p>
        </div>
      )}
    </div>
  );
};
