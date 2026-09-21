export function MetricIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const ICONS = {
  wallet: 'M4 7h16v12H4V7zm3-3h7l3 3H4l3-3zm9 8h4',
  hold: 'M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  bag: 'M6 7h12l1 14H5L6 7zm3 0V5a3 3 0 0 1 6 0v2',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm0 0l9 4 9-4',
  trend: 'M4 19V5m0 14h16M7 14l4-5 3 3 5-7',
  users: 'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m8-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  store: 'M4 10h16v9H4v-9zm2-4h12l2 4H4l2-4z',
  alert: 'M12 9v4m0 4h.01M10.3 5l-8 14h16l-8-14z',
};

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel(now = new Date()) {
  return now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function initials(value?: string | null) {
  if (!value) return 'NM';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

