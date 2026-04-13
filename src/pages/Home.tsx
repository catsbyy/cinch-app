import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { generateRoomCode, addHostRoom, getOrCreateParticipantId } from '../lib/storage';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom(solo = false) {
    setCreating(true);
    setError(null);

    try {
      const hostId = getOrCreateParticipantId();
      let code = generateRoomCode();

      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const { data } = await supabase.from('rooms').select('id').eq('code', code).single();
        if (!data) break;
        code = generateRoomCode();
        attempts++;
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from('rooms').insert({
        code,
        host_id: hostId,
        status: 'waiting',
        expires_at: expiresAt,
      });

      if (insertError) throw insertError;

      addHostRoom(code);

      if (solo) {
        navigate(`/room/${code}/prefs`, { state: { solo: true } });
      } else {
        navigate(`/room/${code}`);
      }
    } catch {
      setError('Could not create room. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  function joinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    navigate(`/room/${code}`);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        <motion.div
          className={styles.hero}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className={styles.title}>Cinch</h1>
          <p className={styles.tagline}>Find a movie everyone actually wants to watch.</p>
        </motion.div>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          <button
            className={styles.cta}
            onClick={() => createRoom(false)}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create a room'}
          </button>

          <div className={styles.joinRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              maxLength={12}
            />
            <button className={styles.joinBtn} onClick={joinRoom}>
              Join
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className={styles.error}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button
            className={styles.solo}
            onClick={() => createRoom(true)}
            disabled={creating}
          >
            Just me tonight →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
