import { useEffect, useRef } from 'react';
import styles from '@/pages/Auth.module.css';

type GoogleCredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let googleScript: Promise<void> | null = null;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScript) return googleScript;
  googleScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
  return googleScript;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.3-2.1 3.5-5.3 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.3C.5 8.2 0 10.1 0 12s.5 3.8 1.3 5.5l4.1-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.4 0 3.3 2.6 1.3 6.5l4.1 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

type Props = {
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
};

export function GoogleSignIn({
  onCredential,
  onError,
  disabled,
  label = 'Sign in with',
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId || !hostRef.current) return;
    const el = hostRef.current;
    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !el) return;
        el.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) void callbackRef.current(response.credential);
          },
        });
        window.google.accounts.id.renderButton(el, {
          type: 'icon',
          shape: 'circle',
          theme: 'outline',
          size: 'medium',
        });
      })
      .catch(() => {
        if (!cancelled) onError?.('Could not load Google Sign-In');
      });

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [clientId, onError]);

  function onFallbackClick() {
    if (disabled) return;
    onError?.(
      'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID to your .env.',
    );
  }

  return (
    <div className={styles.social}>
      <p className={styles.socialLabel}>{label}</p>
      <div className={styles.socialLogos}>
        <div className={styles.googleWrap}>
          <span className={styles.googleFace}>
            <GoogleMark />
          </span>
          {clientId ? (
            <div ref={hostRef} className={styles.googleHit} aria-label="Sign in with Google" />
          ) : (
            <button
              type="button"
              className={styles.googleHit}
              onClick={onFallbackClick}
              aria-label="Sign in with Google"
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
