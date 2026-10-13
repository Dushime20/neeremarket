import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './ActionIconButton.module.css';

export type ActionIconType =
  | 'view'
  | 'inspect'
  | 'edit'
  | 'delete'
  | 'check'
  | 'cross'
  | 'ban'
  | 'send'
  | 'refresh'
  | 'plus';

export type ActionIconTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'purple';

export interface ActionIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ActionIconType;
  label?: string;
  tone?: ActionIconTone;
  size?: 'sm' | 'md';
}

function getDefaultTone(icon: ActionIconType): ActionIconTone {
  switch (icon) {
    case 'view':
    case 'inspect':
      return 'info';
    case 'edit':
      return 'brand';
    case 'check':
      return 'success';
    case 'delete':
    case 'cross':
    case 'ban':
      return 'danger';
    case 'send':
      return 'purple';
    case 'refresh':
      return 'warning';
    case 'plus':
      return 'brand';
    default:
      return 'neutral';
  }
}

function renderIconSvg(icon: ActionIconType) {
  switch (icon) {
    case 'view':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'inspect':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M18 6 6 18M6 6l12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ban':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m4.93 4.93 14.14 14.14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'send':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m22 2-7 20-4-9-9-4ZM22 2 11 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'refresh':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export const ActionIconButton = forwardRef<
  HTMLButtonElement,
  ActionIconButtonProps
>(
  (
    {
      icon,
      label,
      tone,
      size = 'md',
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const finalTone = tone || getDefaultTone(icon);

    const toneClass =
      finalTone === 'brand'
        ? styles.toneBrand
        : finalTone === 'info'
          ? styles.toneInfo
          : finalTone === 'success'
            ? styles.toneSuccess
            : finalTone === 'danger'
              ? styles.toneDanger
              : finalTone === 'warning'
                ? styles.toneWarning
                : finalTone === 'purple'
                  ? styles.tonePurple
                  : styles.toneNeutral;

    const sizeClass = size === 'sm' ? styles.sizeSm : styles.sizeMd;
    const resolvedLabel = label || (typeof props.title === 'string' ? props.title : '') || props['aria-label'] || icon;

    return (
      <button
        ref={ref}
        type={type}
        title={props.title || resolvedLabel}
        aria-label={props['aria-label'] || resolvedLabel}
        className={`${styles.btn} ${toneClass} ${sizeClass} ${className}`.trim()}
        {...props}
      >
        {renderIconSvg(icon)}
      </button>
    );
  },
);

ActionIconButton.displayName = 'ActionIconButton';
