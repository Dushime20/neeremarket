import { InboxPage } from './workspace/InboxPage';

export function MessagesPage() {
  return (
    <div className="container">
      <InboxPage basePath="/messages" />
    </div>
  );
}
