import React from 'react';

interface ReceiptPreviewPanelProps {
  preview?: string | null;
  className?: string;
}

const ReceiptPreviewPanel: React.FC<ReceiptPreviewPanelProps> = ({ preview, className = '' }) => (
  <div className={`terminal-module-panel rounded-2xl overflow-hidden ${className}`.trim()}>
    <div className="px-5 py-4 border-b border-zinc-800/80 bg-blue-500/[0.06]">
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/90">
        Receipt Preview
      </p>
    </div>
    <div className="p-5 sm:p-6">
      {preview ? (
        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-black/30">
          <img
            src={preview}
            alt="Receipt"
            className="w-full max-h-[28rem] lg:max-h-[36rem] xl:max-h-[42rem] object-contain mx-auto"
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500 normal-case text-center py-12">No receipt attached.</p>
      )}
    </div>
  </div>
);

export default ReceiptPreviewPanel;
