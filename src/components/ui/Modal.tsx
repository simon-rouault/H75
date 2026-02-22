'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullScreen?: boolean;
}

export function Modal({ open, onClose, title, children, footer, fullScreen }: ModalProps) {
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
      className={`fixed inset-0 z-50 flex justify-center ${fullScreen ? 'items-stretch sm:items-center' : 'items-end sm:items-center'}`}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className={`bg-card border border-border/80 w-full flex flex-col animate-slide-up ${
        fullScreen
          ? 'h-full sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:max-w-[420px]'
          : 'rounded-t-3xl sm:rounded-3xl max-w-[420px] max-h-[85dvh]'
      }`}>
        {title && (
          <div className={`flex items-center justify-between flex-shrink-0 ${fullScreen ? 'px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-0 mb-4' : 'p-6 pb-0 mb-6'}`}>
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
          <div className={`flex-shrink-0 px-6 pt-3 border-t border-border/30 bg-card ${fullScreen ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))] rounded-b-3xl sm:rounded-b-3xl'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
