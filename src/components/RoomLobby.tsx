import { useState } from 'react';
import { Timer } from './Timer';
import { ParticipantList } from './ParticipantList';
import type { Room, Preference } from '../types';
import styles from './RoomLobby.module.css';

interface Props {
  code: string;
  room: Room;
  preferences: Preference[];
  isHost: boolean;
  onClose: () => void;
}

export function RoomLobby({ code, room, preferences, isHost, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.lobby}>
      {/* Room code section */}
      <div className={styles.codeBlock}>
        <div className={styles.codeLabel}>Room code</div>
        <div className={styles.code}>{code}</div>
        <button className={styles.copyBtn} onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Timer + count */}
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Time left</span>
          <Timer expiresAt={room.expires_at} onExpire={isHost ? onClose : undefined} />
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Submitted</span>
          <span className={styles.metaValue}>{preferences.length}</span>
        </div>
      </div>

      {/* Participant list */}
      <div className={styles.participants}>
        <div className={styles.participantsLabel}>Participants</div>
        <ParticipantList preferences={preferences} />
      </div>

      {/* Host / non-host actions */}
      {isHost ? (
        <button className={styles.closeBtn} onClick={onClose}>
          Get results now
        </button>
      ) : (
        <p className={styles.waiting}>Waiting for everyone…</p>
      )}
    </div>
  );
}
