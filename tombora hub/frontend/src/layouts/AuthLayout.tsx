import { Link, Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { APP_LOGO_SRC, APP_NAME } from '@/config/brand';
import { postLoginPath } from '@/utils/auth';
import styles from './AuthLayout.module.css';

const PROMO_IMAGE =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80';

export function AuthLayout() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { data: user, isLoading } = useMe();
  const isJoin = pathname.startsWith('/register');

  if (!isLoading && user) {
    return <Navigate to={postLoginPath(user.roles, params.get('next'))} replace />;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo} aria-label={`${APP_NAME} home`}>
            <img src={APP_LOGO_SRC} alt={APP_NAME} />
          </Link>
          <Link to="/help" className={styles.help}>
            Help
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.box}>
          <aside className={styles.promo} aria-hidden="true">
            <img src={PROMO_IMAGE} alt="" />
            <div className={styles.promoCopy}>
              <p className={styles.promoTitle}>
                {isJoin ? 'Join Rwanda’s digital marketplace' : 'Shop verified sellers across Rwanda'}
              </p>
              <p className={styles.promoDesc}>
                {isJoin
                  ? 'Create a free account to buy or sell. Pay and get paid with MTN MoMo & Airtel Money.'
                  : 'Discover local products, pay with Mobile Money, and get delivery nationwide.'}
              </p>
            </div>
          </aside>
          <div className={styles.card}>
            <Outlet />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
