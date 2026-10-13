import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/api/hooks';
import { EmptyState } from '@/components/ui';
import { DisputeThread } from '@/components/disputes/DisputeThread';
import styles from './workspace.module.css';

export function SellerDisputeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: user } = useMe();

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate(`/login?next=/seller/disputes/${id}`)}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dispute | NeereMarket</title>
      </Helmet>
      <DisputeThread id={id} backTo="/seller/disputes" backLabel="All disputes" layout="workspace" />
    </>
  );
}
