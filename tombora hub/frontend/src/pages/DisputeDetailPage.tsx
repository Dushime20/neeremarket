import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/api/hooks';
import { EmptyState } from '@/components/ui';
import { DisputeThread } from '@/components/disputes/DisputeThread';
import { pageTitle } from '@/config/brand';
import { loginHref } from '@/utils/auth';

export function DisputeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();

  if (!isLoading && !user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to view this dispute"
          actionLabel="Log in"
          onAction={() => navigate(loginHref(`/disputes/${id}`))}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: '1rem 2rem' }}>
      <Helmet>
        <title>{pageTitle('Dispute')}</title>
      </Helmet>
      {user ? <DisputeThread id={id} backTo="/disputes" backLabel="Resolution center" /> : null}
    </div>
  );
}
