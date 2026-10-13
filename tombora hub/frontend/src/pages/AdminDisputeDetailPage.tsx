import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/api/hooks';
import { EmptyState } from '@/components/ui';
import { DisputeThread } from '@/components/disputes/DisputeThread';
import { isAdminRole } from '@/utils/auth';
import styles from './workspace.module.css';

export function AdminDisputeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: user } = useMe();

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Admin login required"
          actionLabel="Log in"
          onAction={() => navigate(`/login?next=/admin/disputes/${id}`)}
        />
      </div>
    );
  }

  if (!isAdminRole(user.roles)) return <Navigate to="/" replace />;

  return (
    <>
      <Helmet>
        <title>Dispute | NeereMarket admin</title>
      </Helmet>
      <DisputeThread id={id} backTo="/admin/disputes" backLabel="All disputes" layout="workspace" />
    </>
  );
}
