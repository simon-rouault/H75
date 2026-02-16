'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-[420px] max-h-[85dvh] flex flex-col animate-slide-up">
        {title && (
          <div className="flex items-center justify-between p-6 pb-0 mb-6 flex-shrink-0">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <button onClick={onClose} className="text-muted hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/[0.06]">
              ✕
            </button>
          </div>
        )}
        <div className={`overflow-y-auto flex-1 min-h-0 px-6 ${footer ? 'pb-4' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]'}`}>
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border/30 bg-card rounded-b-3xl sm:rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
