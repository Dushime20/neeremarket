import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastOptions = {
  title?: string;
  message: string;
  tone?: ToastTone;
  duration?: number;
};

export type ToastItem = ToastOptions & {
  id: string;
  isDismissing?: boolean;
};

type ToastContextValue = {
  toast: (opts: ToastOptions | string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let globalToastHandler: ((opts: ToastOptions) => void) | null = null;

/**
 * Imperative toast function usable outside of React components if needed.
 */
export const toast = {
  show: (opts: ToastOptions | string) => {
    const payload = typeof opts === 'string' ? { message: opts } : opts;
    globalToastHandler?.(payload);
  },
  success: (message: string, title?: string) => {
    globalToastHandler?.({ message, title, tone: 'success' });
  },
  error: (message: string, title?: string) => {
    globalToastHandler?.({ message, title, tone: 'error' });
  },
  warning: (message: string, title?: string) => {
    globalToastHandler?.({ message, title, tone: 'warning' });
  },
  info: (message: string, title?: string) => {
    globalToastHandler?.({ message, title, tone: 'info' });
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDismissing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (opts: ToastOptions | string) => {
      const payload: ToastOptions =
        typeof opts === 'string' ? { message: opts } : opts;
      const id = Math.random().toString(36).slice(2, 9);
      const tone = payload.tone || 'info';
      const duration = payload.duration ?? 4000;

      const item: ToastItem = {
        ...payload,
        id,
        tone,
        duration,
      };

      setToasts((prev) => [...prev.slice(-4), item]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss],
  );

  // Link imperative handler
  globalToastHandler = addToast;

  const value: ToastContextValue = {
    toast: addToast,
    success: (message, title) => addToast({ message, title, tone: 'success' }),
    error: (message, title) => addToast({ message, title, tone: 'error' }),
    warning: (message, title) => addToast({ message, title, tone: 'warning' }),
    info: (message, title) => addToast({ message, title, tone: 'info' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="false">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const tone = item.tone || 'info';

  return (
    <div
      role="status"
      className={`${styles.toast} ${styles[tone]} ${item.isDismissing ? styles.toastDismissing : ''}`}
    >
      <div className={styles.iconWrap}>
        <ToastIcon tone={tone} />
      </div>

      <div className={styles.content}>
        {item.title ? <h4 className={styles.title}>{item.title}</h4> : null}
        <p className={styles.message}>{item.message}</p>
      </div>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {item.duration ? (
        <span
          className={styles.progress}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      ) : null}
    </div>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
    </svg>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return toast;
  }
  return ctx;
}
