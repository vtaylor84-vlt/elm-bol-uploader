import React, { useRef } from 'react';
import { UPLOAD_FORMAT_HINT } from '../../utils/uploadFileRules.ts';

interface ReceiptUploadZoneProps {
  preview?: string | null;
  fileName?: string;
  fileSizeMb?: number;
  onPick: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

const ReceiptUploadZone: React.FC<ReceiptUploadZoneProps> = ({
  preview,
  fileName,
  fileSizeMb,
  onPick,
  onRemove,
  error,
}) => {
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onPick(file);
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          className="group w-full rounded-2xl border-2 border-dashed border-blue-500/35 bg-gradient-to-b from-blue-500/[0.07] to-transparent py-12 sm:py-16 px-6 text-center transition-all duration-300 hover:border-blue-400/60 hover:shadow-[0_0_40px_rgba(59,130,246,0.12)] active:scale-[0.99]"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-blue-400">
              <path
                d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
            Tap to take photo or choose from gallery
          </p>
          <p className="text-xs text-zinc-500 normal-case mt-3 max-w-xs mx-auto leading-relaxed">
            {UPLOAD_FORMAT_HINT}
          </p>
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/80 overflow-hidden expense-reveal-field">
          <div className="relative">
            <img
              src={preview}
              alt="Receipt preview"
              className="w-full max-h-72 sm:max-h-96 object-contain bg-black/40"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-3 right-3 w-9 h-9 rounded-full border border-zinc-600 bg-black/70 text-zinc-300 hover:text-red-400 hover:border-red-500/50 flex items-center justify-center text-lg"
              aria-label="Remove receipt"
            >
              ×
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80">
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{fileName}</p>
              {fileSizeMb != null ? (
                <p className="text-[10px] text-zinc-500 mt-0.5">{fileSizeMb.toFixed(1)} MB</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full min-h-[48px] rounded-xl border border-zinc-800 bg-zinc-950/60 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-blue-500/30 hover:text-blue-300 transition-colors"
        >
          Choose from gallery
        </button>
      ) : null}

      {error ? (
        <p className="text-[12px] text-red-400 normal-case text-center" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={camRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default ReceiptUploadZone;
