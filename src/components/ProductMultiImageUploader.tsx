import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Ratio,
  Eye,
  X,
} from 'lucide-react';

export type ImageAspectRatio = '1:1' | '4:3' | '16:9' | '3:4' | 'auto';
export type ImageFitMode = 'contain' | 'cover';

interface ProductMultiImageUploaderProps {
  images: string[];
  token: string;
  onChange: (images: string[]) => void;
  aspectRatio?: ImageAspectRatio;
  fitMode?: ImageFitMode;
  onAspectRatioChange?: (ratio: ImageAspectRatio) => void;
  onFitModeChange?: (mode: ImageFitMode) => void;
}

export const ProductMultiImageUploader: React.FC<ProductMultiImageUploaderProps> = ({
  images,
  token,
  onChange,
  aspectRatio = '1:1',
  fitMode = 'contain',
  onAspectRatioChange,
  onFitModeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Convert files to base64 and batch upload
  const handleFiles = async (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 15 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 15MB limit.`);
        setTimeout(() => setUploadError(null), 4000);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress({ total: validFiles.length, done: 0 });

    try {
      // Read all files as base64
      const filePayloads = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise<{ fileName: string; mimeType: string; data: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  fileName: file.name,
                  mimeType: file.type || 'image/jpeg',
                  data: reader.result as string,
                });
              };
              reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );

      // Attempt fast batch upload
      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ items: filePayloads }),
      });

      if (res.ok) {
        const data = await res.json();
        const newUrls = (data.images || []).map((img: any) => img.url);
        onChange([...images, ...newUrls]);
        setUploadProgress(null);
        setUploadSuccess(`Successfully uploaded ${newUrls.length} images!`);
        setTimeout(() => setUploadSuccess(null), 4000);
        return;
      }

      // Fallback: sequential single uploads
      const uploadedUrls: string[] = [];
      for (let i = 0; i < filePayloads.length; i++) {
        const item = filePayloads[i];
        const singleRes = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(item),
        });
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          uploadedUrls.push(singleData.url);
        }
        setUploadProgress({ total: validFiles.length, done: i + 1 });
      }

      onChange([...images, ...uploadedUrls]);
      setUploadProgress(null);
      setUploadSuccess(`Uploaded ${uploadedUrls.length} images successfully!`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadProgress(null);
      setUploadError(err.message || 'Error occurred while uploading images.');
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  // Drag and drop handlers
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Direct URL submission
  const handleAddDirectUrl = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (directUrlInput.trim()) {
      onChange([...images, directUrlInput.trim()]);
      setDirectUrlInput('');
      setUploadSuccess('Image URL added to gallery!');
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  // Reordering helpers
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([item, ...rest]);
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const newArr = [...images];
    const temp = newArr[index - 1];
    newArr[index - 1] = newArr[index];
    newArr[index] = temp;
    onChange(newArr);
  };

  const handleMoveRight = (index: number) => {
    if (index >= images.length - 1) return;
    const newArr = [...images];
    const temp = newArr[index + 1];
    newArr[index + 1] = newArr[index];
    newArr[index] = temp;
    onChange(newArr);
  };

  const handleDelete = (index: number) => {
    onChange(images.filter((_, idx) => idx !== index));
  };

  // Aspect Ratio CSS Class helper
  const getAspectRatioClass = (ratio: ImageAspectRatio) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square';
      case '4:3':
        return 'aspect-[4/3]';
      case '16:9':
        return 'aspect-[16/9]';
      case '3:4':
        return 'aspect-[3/4]';
      case 'auto':
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Aspect Ratio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1b1920] border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Product Images Gallery
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#922CB5]/30 text-[#B7F34B] border border-[#922CB5]/40 font-mono">
              {images.length} {images.length === 1 ? 'image' : 'images'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Upload multiple photos in any aspect ratio. First photo serves as the catalogue cover.
          </p>
        </div>

        {/* Aspect Ratio & Fit Selector Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Ratio Selector */}
          <div className="flex items-center bg-[#151419] p-1 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 flex items-center gap-1">
              <Ratio className="w-3 h-3 text-[#B7F34B]" />
              Ratio:
            </span>
            {(['1:1', '4:3', '16:9', '3:4'] as ImageAspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onAspectRatioChange && onAspectRatioChange(r)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  aspectRatio === r
                    ? 'bg-[#922CB5] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Fit Mode Toggle */}
          <div className="flex items-center bg-[#151419] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => onFitModeChange && onFitModeChange('contain')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fitMode === 'contain'
                  ? 'bg-[#B7F34B] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Show entire device with studio dark padding (Recommended for phones)"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => onFitModeChange && onFitModeChange('cover')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fitMode === 'cover'
                  ? 'bg-[#B7F34B] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Fill entire frame"
            >
              Fill
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {uploadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Multi-Image Dropzone */}
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
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            uploadProgress ? 'bg-[#922CB5]/30 text-[#B7F34B]' : 'bg-white/5 text-[#B7F34B]'
          }`}
        >
          {uploadProgress ? (
            <div className="w-5 h-5 border-2 border-[#B7F34B] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>

        <div>
          <span className="text-xs font-bold text-white block group-hover:text-[#B7F34B] transition-colors">
            {uploadProgress
              ? `Uploading batch: ${uploadProgress.done} of ${uploadProgress.total} images...`
              : 'Click to select multiple photos or drag & drop files here'}
          </span>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">
            Select 1 to 20 images at once • PNG, JPG, WebP, or SVG • Stored in PostgreSQL
          </span>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress && (
          <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#B7F34B] transition-all duration-300"
              style={{
                width: `${
                  uploadProgress.total > 0
                    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Direct URL Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={directUrlInput}
            onChange={(e) => setDirectUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddDirectUrl(e);
              }
            }}
            placeholder="Or paste an image URL directly: https://example.com/device-photo.jpg"
            className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
          />
          <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={handleAddDirectUrl}
          disabled={!directUrlInput.trim()}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold text-white transition-all cursor-pointer"
        >
          Add URL
        </button>
      </div>

      {/* Interactive Reorderable Gallery Grid */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Product Photos ({images.length})
            </span>
            <span className="text-[10px] text-zinc-500">
              Drag or use arrows to rearrange • Primary image is shown first
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((imgUrl, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border transition-all overflow-hidden bg-[#151419] p-1.5 flex flex-col justify-between ${
                    isCover
                      ? 'border-[#B7F34B] shadow-[0_0_15px_rgba(183,243,75,0.25)] ring-1 ring-[#B7F34B]/40'
                      : 'border-white/10 hover:border-white/25 hover:bg-[#1a1820]'
                  }`}
                >
                  {/* Aspect Ratio Preview Container */}
                  <div
                    className={`relative w-full ${getAspectRatioClass(
                      aspectRatio
                    )} rounded-xl bg-[#242129]/80 overflow-hidden flex items-center justify-center p-2`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Product image ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                        fitMode === 'cover' ? 'object-cover' : 'object-contain'
                      }`}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      {isCover ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#B7F34B] text-black shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-black" />
                          Cover
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 text-zinc-300 backdrop-blur-sm">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Quick Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewZoomUrl(imgUrl)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      title="Enlarge Image"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-1 border-t border-white/5 mt-1">
                    {/* Make Cover Button */}
                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(idx)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-[#B7F34B]/20 hover:text-[#B7F34B] text-zinc-400 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Set as primary catalogue cover"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Cover</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-[#B7F34B] px-1">Primary</span>
                    )}

                    {/* Reorder and Delete controls */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleMoveLeft(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300 hover:text-white text-xs cursor-pointer"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveRight(idx)}
                        disabled={idx === images.length - 1}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-300 hover:text-white text-xs cursor-pointer"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs cursor-pointer ml-1"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#151419] border border-dashed border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            No images uploaded yet. Upload front, back, angle, and box photos to give buyers a complete view.
          </p>
        </div>
      )}

      {/* Zoom Preview Lightbox Modal */}
      {previewZoomUrl && (
        <div
          onClick={() => setPreviewZoomUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#151419] rounded-3xl border border-white/10 p-4 overflow-hidden flex flex-col items-center shadow-2xl cursor-default"
          >
            <button
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewZoomUrl}
              alt="Enlarged preview"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
            />
            <div className="mt-3 text-xs text-zinc-400 font-mono">
              Aspect Ratio Preview Mode: <span className="text-[#B7F34B]">{aspectRatio}</span> • Fit Mode:{' '}
              <span className="text-[#B7F34B]">{fitMode}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
