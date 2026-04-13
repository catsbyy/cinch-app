import type { Preference } from '../types';

interface Props {
  preferences: Preference[];
}

export function ParticipantList({ preferences }: Props) {
  if (preferences.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
        No one has submitted yet.
      </p>
    );
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {preferences.map((pref, i) => (
        <li
          key={pref.id}
          style={{
            fontSize: '13px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          Guest {i + 1}
        </li>
      ))}
    </ul>
  );
}
