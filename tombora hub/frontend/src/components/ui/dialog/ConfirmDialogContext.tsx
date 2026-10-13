import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './ConfirmDialog.module.css';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
};

type ConfirmState = ConfirmOptions & {
  isOpen: boolean;
  isClosing: boolean;
  resolve: (value: boolean) => void;
};

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      const payload: ConfirmOptions =
        typeof options === 'string' ? { message: options } : options;

      setState({
        title: payload.title || 'Confirm action',
        message: payload.message,
        confirmText: payload.confirmText || 'Confirm',
        cancelText: payload.cancelText || 'Cancel',
        tone: payload.tone || 'danger',
        isOpen: true,
        isClosing: false,
        resolve,
      });
    });
  }, []);

  const closeWith = useCallback((result: boolean) => {
    setState((prev) => {
      if (!prev) return null;
      return { ...prev, isClosing: true };
    });

    setTimeout(() => {
      setState((prev) => {
        prev?.resolve(result);
        return null;
      });
    }, 180);
  }, []);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!state?.isOpen) return;

    // Focus confirm button when dialog appears
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeWith(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [state?.isOpen, closeWith]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state?.isOpen ? (
        <div
          className={`${styles.overlay} ${state.isClosing ? styles.overlayClosing : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeWith(false);
            }
          }}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            className={`${styles.dialog} ${styles[state.tone || 'danger']} ${state.isClosing ? styles.dialogClosing : ''}`}
          >
            <div className={styles.head}>
              <div className={styles.iconWrap}>
                <ToneIcon tone={state.tone || 'danger'} />
              </div>

              <div className={styles.copy}>
                <h3 id="confirm-dialog-title" className={styles.title}>
                  {state.title}
                </h3>
                <p id="confirm-dialog-desc" className={styles.message}>
                  {state.message}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => closeWith(false)}
              >
                {state.cancelText}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={styles.confirmBtn}
                onClick={() => closeWith(true)}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

function ToneIcon({ tone }: { tone: ConfirmTone }) {
  if (tone === 'danger') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    // Fallback if rendered outside provider
    return async (options) => {
      const msg = typeof options === 'string' ? options : options.message;
      return window.confirm(msg);
    };
  }
  return confirm;
}
