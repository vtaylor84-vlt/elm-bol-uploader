import React, { useEffect, useRef } from 'react';

interface LogoutConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
    >
      <div className="terminal-glass-panel w-full max-w-sm p-6 space-y-5 shadow-[0_0_48px_rgba(59,130,246,0.2)]">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400/80 mb-2">
            Session
          </p>
          <h2 id="logout-dialog-title" className="text-lg font-black uppercase tracking-tight text-white">
            Switch user?
          </h2>
          <p className="mt-2 text-sm text-zinc-400 normal-case">
            Are you sure you want to log out? Your session will be cleared and you will return to
            the login screen.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600/90 to-red-500/90 border border-red-400/40 text-[9px] font-black uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmDialog;
