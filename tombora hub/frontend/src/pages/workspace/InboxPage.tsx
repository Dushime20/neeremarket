import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useMessageThreads, useSendMessage, useThread } from '@/api/hooks';
import { Alert, Button, EmptyState, Input } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from '../workspace.module.css';

export function InboxPage({
  basePath,
  scopeAll = false,
}: {
  basePath: string;
  scopeAll?: boolean;
}) {
  const { threadId } = useParams();
  const { data: user } = useMe();
  const { data: threads, isLoading } = useMessageThreads(scopeAll);
  const { data: threadData } = useThread(threadId || '', scopeAll);
  const send = useSendMessage();
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Log in to open inbox"
          actionLabel="Log in"
          onAction={() => navigate(loginHref(basePath))}
        />
      </div>
    );
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!threadId || !body.trim()) return;
    setError(null);
    try {
      await send.mutateAsync({ threadId, body: body.trim() });
      setBody('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Messages | NeereMarket</title>
      </Helmet>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Inbox</p>
          <h1>Messages</h1>
          <p>{scopeAll ? 'All marketplace conversations.' : 'Buyer conversations for your store.'}</p>
        </div>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className={styles.inbox}>
        <aside className={styles.threadList}>
          {isLoading ? <div className={styles.panelBody}>Loading…</div> : null}
          {!isLoading && threads?.items.length === 0 ? (
            <div className={styles.panelBody}>
              <EmptyState compact title="No conversations yet" />
            </div>
          ) : null}
          {threads?.items.map((t) => (
            <Link
              key={t.id}
              to={`${basePath}/${t.id}`}
              className={threadId === t.id ? styles.threadOn : undefined}
            >
              <strong>{t.customerName || t.sellerName || 'Conversation'}</strong>
              <p>{t.lastMessage?.body || 'No messages yet'}</p>
            </Link>
          ))}
        </aside>
        <section className={styles.chat}>
          {!threadId ? (
            <div className={styles.panelBody}>
              <EmptyState compact title="Select a conversation" />
            </div>
          ) : (
            <>
              <div className={styles.chatLog}>
                {threadData?.messages.map((m) => (
                  <article
                    key={m.id}
                    className={m.senderId === user.id ? styles.bubbleMine : styles.bubbleTheirs}
                  >
                    <strong>{m.sender.fullName}</strong>
                    <p>{m.body}</p>
                    <small>{new Date(m.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
              <form className={styles.composer} onSubmit={onSend}>
                <Input
                  label="Reply"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
                <Button type="submit" disabled={send.isPending}>
                  Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
