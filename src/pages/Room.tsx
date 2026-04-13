import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { RoomLobby } from '../components/RoomLobby';
import styles from './Room.module.css';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, preferences, isHostUser, loading, error, closeRoom } = useRoom(code ?? '');

  // Navigate all clients when room is closed
  useEffect(() => {
    if (room?.status === 'closed') {
      navigate(`/room/${code}/results`);
    }
  }, [room?.status, code, navigate]);

  async function handleClose() {
    await closeRoom();
    // Navigation will happen via the useEffect above once the realtime update arrives
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.loader}>
          <div className={styles.loaderTitle}>Loading room…</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className={styles.center}>
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Room not found</div>
          <p className={styles.errorHint}>Double-check the code and try again.</p>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        <AnimatePresence mode="wait">
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className={styles.header}>
              <div className={styles.kicker}>Room</div>
            </div>

            <RoomLobby
              code={code ?? ''}
              room={room}
              preferences={preferences}
              isHost={isHostUser}
              onClose={handleClose}
            />

            <div className={styles.prefsAction}>
              <button
                className={styles.prefsBtn}
                onClick={() => navigate(`/room/${code}/prefs`)}
              >
                Submit my preferences
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
