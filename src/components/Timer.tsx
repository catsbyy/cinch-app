import { useTimer } from '../hooks/useTimer';

interface Props {
  expiresAt: string;
  onExpire?: () => void;
}

export function Timer({ expiresAt, onExpire }: Props) {
  const secondsLeft = useTimer(expiresAt);

  if (secondsLeft === 0 && onExpire) {
    onExpire();
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const urgent = secondsLeft < 60;

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: urgent ? 'var(--accent)' : 'var(--muted)',
        fontSize: '13px',
        letterSpacing: '0.3px',
        transition: 'color 500ms ease',
      }}
    >
      {display}
    </span>
  );
}
