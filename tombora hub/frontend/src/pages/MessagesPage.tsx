import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useMe,
  useMessageThreads,
  useMessageableSellers,
  useSendMessage,
  useThread,
  type MessageableSeller,
} from '@/api/hooks';
import { Alert, Badge, EmptyState } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { loginHref } from '@/utils/auth';
import styles from './MessagesPage.module.css';

type ChatPartner = { name: string; logoUrl: string | null; storeSlug?: string };

function formatStamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function Avatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <span className={styles.avatar} aria-hidden>
      {logoUrl ? <img src={logoUrl} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function MessagesPage() {
  const { threadId, sellerId: draftSellerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useMe();

  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const { data: threads, isLoading: threadsLoading } = useMessageThreads(false, !!user);
  const { data: threadData, isLoading: threadLoading } = useThread(threadId || '');
  const { data: sellers, isFetching: sellersLoading } = useMessageableSellers(
    query,
    !!user && (picking || !!draftSellerId),
  );
  const send = useSendMessage();

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setBody('');
    setError(null);
  }, [threadId, draftSellerId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [threadData?.messages.length, threadId]);

  const chatOpen = !!threadId || !!draftSellerId;

  useEffect(() => {
    if (!chatOpen || !window.matchMedia('(max-width: 900px)').matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatOpen]);

  const partner = useMemo<ChatPartner | null>(() => {
    if (threadId) {
      const t = threads?.items.find((i) => i.id === threadId);
      return t ? { name: t.sellerName || 'Seller', logoUrl: t.sellerLogoUrl } : null;
    }
    if (draftSellerId) {
      const fromState = (location.state as { seller?: MessageableSeller } | null)?.seller;
      const s =
        fromState?.sellerId === draftSellerId
          ? fromState
          : sellers?.items.find((i) => i.sellerId === draftSellerId);
      return s ? { name: s.storeName, logoUrl: s.logoUrl, storeSlug: s.storeSlug } : null;
    }
    return null;
  }, [threadId, draftSellerId, threads, sellers, location.state]);

  if (userLoading) {
    return <div className="container">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="container">
        <EmptyState
          title="Log in to open your messages"
          actionLabel="Log in"
          onAction={() => navigate(loginHref('/messages'))}
        />
      </div>
    );
  }

  function openPicker() {
    setSearch('');
    setQuery('');
    setPicking(true);
    window.scrollTo({ top: 0 });
  }

  function pickSeller(seller: MessageableSeller) {
    setPicking(false);
    if (seller.threadId) {
      navigate(`/messages/${seller.threadId}`);
    } else {
      navigate(`/messages/new/${seller.sellerId}`, { state: { seller } });
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    try {
      if (threadId) {
        await send.mutateAsync({ threadId, body: text });
        setBody('');
      } else if (draftSellerId) {
        const result = await send.mutateAsync({ sellerId: draftSellerId, body: text });
        navigate(`/messages/${result.threadId}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const threadItems = threads?.items ?? [];

  return (
    <div className="container">
      <Helmet>
        <title>Messages | NeereMarket</title>
      </Helmet>
      <div className={`${styles.layout} ${chatOpen ? styles.chatOpen : ''}`}>
        <aside className={styles.sidebar}>
          {picking ? (
            <>
              <header className={styles.sideHead}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setPicking(false)}
                  aria-label="Back to chats"
                >
                  ←
                </button>
                <h1>Select a seller</h1>
              </header>
              <div className={styles.search}>
                <input
                  type="search"
                  placeholder="Search sellers or stores"
                  aria-label="Search sellers"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <ul className={styles.list}>
                {sellersLoading && !sellers ? <li className={styles.note}>Loading sellers…</li> : null}
                {sellers && sellers.items.length === 0 ? (
                  <li className={styles.note}>No sellers match “{query}”.</li>
                ) : null}
                {sellers?.items.map((s) => (
                  <li key={s.sellerId}>
                    <button type="button" className={styles.row} onClick={() => pickSeller(s)}>
                      <Avatar name={s.storeName} logoUrl={s.logoUrl} />
                      <span className={styles.rowMain}>
                        <span className={styles.rowTop}>
                          <strong>{s.storeName}</strong>
                          {s.verified ? <Badge>Verified</Badge> : null}
                        </span>
                        <span className={styles.rowSub}>
                          {s.threadId ? 'Continue conversation' : s.location || 'Rwanda'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <header className={styles.sideHead}>
                <h1>Chats</h1>
                <button
                  type="button"
                  className={styles.newChat}
                  onClick={openPicker}
                  aria-label="Start a new chat"
                >
                  + New chat
                </button>
              </header>
              <ul className={styles.list}>
                {threadsLoading ? <li className={styles.note}>Loading…</li> : null}
                {!threadsLoading && threadItems.length === 0 ? (
                  <li>
                    <EmptyState
                      compact
                      title="No conversations yet"
                      description="Pick a seller to ask about products, prices or delivery."
                      actionLabel="Start a chat"
                      onAction={openPicker}
                    />
                  </li>
                ) : null}
                {threadItems.map((t) => {
                  const name = t.sellerName || 'Seller';
                  const unread = t.unreadCount > 0;
                  return (
                    <li key={t.id}>
                      <Link
                        to={`/messages/${t.id}`}
                        className={`${styles.row} ${threadId === t.id ? styles.rowOn : ''}`}
                      >
                        <Avatar name={name} logoUrl={t.sellerLogoUrl} />
                        <span className={styles.rowMain}>
                          <span className={styles.rowTop}>
                            <strong>{name}</strong>
                            <small className={unread ? styles.stampUnread : undefined}>
                              {formatStamp(t.lastMessage?.createdAt || t.updatedAt)}
                            </small>
                          </span>
                          <span className={styles.rowTop}>
                            <span className={styles.rowSub}>
                              {t.lastMessage
                                ? `${t.lastMessage.senderId === user.id ? 'You: ' : ''}${t.lastMessage.body}`
                                : 'No messages yet'}
                            </span>
                            {unread ? <span className={styles.unread}>{t.unreadCount}</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className={styles.fab}
                onClick={openPicker}
                aria-label="Start a new chat"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-4 3v-3.2A2.5 2.5 0 0 1 4 14.5v-8z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path d="M12 7.5v6M9 10.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </>
          )}
        </aside>

        <section className={styles.chat}>
          {!chatOpen ? (
            <div className={styles.placeholder}>
              <EmptyState
                compact
                title="Select a chat"
                description="Choose a conversation on the left, or start a new chat with a seller."
                actionLabel="New chat"
                onAction={openPicker}
              />
            </div>
          ) : (
            <>
              <header className={styles.chatHead}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.backBtn}`}
                  onClick={() => navigate('/messages')}
                  aria-label="Back to chats"
                >
                  ←
                </button>
                <Avatar name={partner?.name || 'S'} logoUrl={partner?.logoUrl ?? null} />
                <div className={styles.chatTitle}>
                  <strong>{partner?.name || 'Conversation'}</strong>
                  {partner?.storeSlug ? (
                    <Link to={`/stores/${partner.storeSlug}`}>View store</Link>
                  ) : null}
                </div>
              </header>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <div className={styles.messages} ref={logRef}>
                {threadId && threadLoading ? <p className={styles.note}>Loading messages…</p> : null}
                {draftSellerId ? (
                  <p className={styles.note}>
                    Say hello to {partner?.name || 'the seller'} — your first message starts the
                    conversation.
                  </p>
                ) : null}
                {threadData?.messages.map((m) => (
                  <article
                    key={m.id}
                    className={m.senderId === user.id ? styles.mine : styles.theirs}
                  >
                    <p>{m.body}</p>
                    <small>{formatStamp(m.createdAt)}</small>
                  </article>
                ))}
              </div>

              <form className={styles.composer} onSubmit={onSend}>
                <input
                  type="text"
                  placeholder="Type a message"
                  aria-label="Message"
                  value={body}
                  maxLength={2000}
                  onChange={(e) => setBody(e.target.value)}
                />
                <button type="submit" disabled={send.isPending || !body.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
