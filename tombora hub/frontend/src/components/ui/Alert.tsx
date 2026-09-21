import styles from './Alert.module.css';

type Props = {
  tone?: 'error' | 'info' | 'success';
  children: string;
};

export function Alert({ tone = 'info', children }: Props) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
