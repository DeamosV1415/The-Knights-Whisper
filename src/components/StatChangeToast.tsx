import { useEffect, useState } from 'react';
import type { StatChange } from '../hooks/useWorldState';

interface StatChangeToastProps {
  changes: StatChange[];
  onDismiss: (id: string) => void;
}

interface ToastItem extends StatChange {
  exiting: boolean;
}

export function StatChangeToast({ changes, onDismiss }: StatChangeToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // When new changes arrive, add them as toasts
  useEffect(() => {
    if (changes.length === 0) return;
    
    const newToasts: ToastItem[] = changes.map(c => ({ ...c, exiting: false }));
    setToasts(prev => [...prev, ...newToasts]);
    
    // Auto-dismiss each toast after 3s
    newToasts.forEach(toast => {
      setTimeout(() => {
        // Start exit animation
        setToasts(prev => prev.map(t => 
          t.id === toast.id ? { ...t, exiting: true } : t
        ));
        // Remove after exit animation completes
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
          onDismiss(toast.id);
        }, 300);
      }, 3000);
    });
  }, [changes, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-[280px] right-4 z-40 flex flex-col gap-2 pointer-events-none"
      style={{ maxHeight: '40vh', overflow: 'hidden' }}
    >
      {toasts.slice(-6).map((toast) => (
        <div
          key={toast.id}
          className={toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(12,10,18,0.92)',
            border: `1px solid ${toast.color}30`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${toast.color}15`,
            backdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            minWidth: '180px',
          }}
        >
          <span className="text-base flex-shrink-0">{toast.emoji}</span>
          <span 
            className="text-[12px] font-mono font-bold tracking-wide"
            style={{ color: toast.color }}
          >
            {toast.label}
          </span>
        </div>
      ))}
    </div>
  );
}
