import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useRegister, useGoogleAuth } from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { APP_NAME } from '@/config/brand';
import { postLoginPath } from '@/utils/auth';
import { PasswordToggle } from './PasswordToggle';
import styles from './Auth.module.css';

export function RegisterPage() {
  const register = useRegister();
  const googleAuth = useGoogleAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const asSeller = params.get('as') === 'seller';
  const signInTo = params.get('next')
    ? `/login?next=${encodeURIComponent(params.get('next') || '')}`
    : '/login';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>(asSeller ? 'SELLER' : 'CUSTOMER');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = register.isPending || googleAuth.isPending;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() && !phone.trim()) {
      setError('Email or phone is required');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the User Agreement and Privacy Policy');
      return;
    }
    try {
      const data = await register.mutateAsync({
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        password,
        role,
      });
      navigate(postLoginPath(data.user.roles, params.get('next')), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    }
  }

  async function onGoogle(idToken: string) {
    setError(null);
    if (!agreed) {
      setError('Please agree to the User Agreement and Privacy Policy');
      return;
    }
    try {
      const data = await googleAuth.mutateAsync({ idToken, role });
      navigate(postLoginPath(data.user.roles, params.get('next')), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Google sign-in failed'));
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Helmet>
        <title>{role === 'SELLER' ? 'Join Free as a seller' : 'Join Free'} | {APP_NAME}</title>
      </Helmet>
      <h1 className="sr-only">Join Free</h1>
      {error ? (
        <div className={styles.alert}>
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Full name</span>
        <input
          className={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Your name"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="Email address"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Phone</span>
        <input
          className={styles.input}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="+2507…"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <span className={styles.passwordWrap}>
          <input
            className={styles.input}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Confirm password</span>
        <input
          className={styles.input}
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Re-enter password"
        />
      </label>

      <fieldset className={styles.role}>
        <legend>I want to</legend>
        <div className={styles.roleRow}>
          <label className={styles.roleOption}>
            <input
              type="radio"
              name="role"
              checked={role === 'CUSTOMER'}
              onChange={() => setRole('CUSTOMER')}
            />
            Shop as a customer
          </label>
          <label className={styles.roleOption}>
            <input
              type="radio"
              name="role"
              checked={role === 'SELLER'}
              onChange={() => setRole('SELLER')}
            />
            Sell as a provider
          </label>
        </div>
      </fieldset>

      <label className={styles.terms}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I agree to the <Link to="/terms">User Agreement</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </span>
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.signIn} disabled={busy}>
          {register.isPending ? 'Creating…' : 'Join Free'}
        </button>
        <Link to={signInTo} className={styles.joinFree}>
          Sign In
        </Link>
      </div>

      <GoogleSignIn
        label="Sign in with"
        onCredential={onGoogle}
        onError={setError}
        disabled={busy}
      />

      <p className={styles.footHelp}>
        <span className={styles.dot} />
        <span>
          Already have an account? <Link to={signInTo}>Sign In</Link>
        </span>
      </p>
    </form>
  );
}
