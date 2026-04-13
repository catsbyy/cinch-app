import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { computeOverlap } from '../lib/overlap';
import { getEnrichedMovies } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import type { Preference, EnrichedMovie, UserPrefs } from '../types';
import styles from './Results.module.css';

export default function Results() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const solo = (location.state as { solo?: boolean } | null)?.solo ?? false;

  const [movies, setMovies] = useState<EnrichedMovie[]>([]);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [reshuffling, setReshuffling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: fetch room
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();

        if (roomError || !roomData) {
          setError('Room not found.');
          setLoading(false);
          return;
        }

        const roomId = (roomData as { id: string }).id;

        // Step 2: fetch preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from('preferences')
          .select('*')
          .eq('room_id', roomId);

        if (prefsError) throw prefsError;

        const prefs = (prefsData as Preference[]) ?? [];

        if (prefs.length === 0) {
          setError('No preferences submitted yet. Try going back to the room.');
          setLoading(false);
          return;
        }

        // Step 3: compute overlap (sync)
        const userPrefs = computeOverlap(prefs);
        setPrefs(userPrefs);

        // Step 4: fetch TMDB movies
        const enriched = await getEnrichedMovies(userPrefs);
        setMovies(enriched);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [code]);

  async function reshuffle() {
    if (!prefs) return;
    setReshuffling(true);
    try {
      const enriched = await getEnrichedMovies(prefs);
      setMovies(enriched);
    } finally {
      setReshuffling(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              className={styles.center}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.loader}>
                <div className={styles.loaderTitle}>Finding your films…</div>
                <div className={styles.loaderHint}>Let the mood settle.</div>
              </div>
            </motion.div>
          )}

          {!loading && error && (
            <motion.div
              key="error"
              className={styles.center}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.errorBox}>
                <div className={styles.errorTitle}>Couldn't load results</div>
                <p className={styles.errorHint}>{error}</p>
                <button className={styles.backBtn} onClick={() => navigate(`/room/${code}`)}>
                  Back to room
                </button>
              </div>
            </motion.div>
          )}

          {!loading && !error && movies.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className={styles.header}>
                <h1 className={styles.heading}>
                  {solo ? "Here are your picks" : "Here's what works for everyone"}
                </h1>
                <div className={styles.hintRow}>
                  <span className={styles.hint}>
                    {solo ? "Based on your mood." : "Based on everyone's preferences."}
                  </span>
                  {prefs && (
                    <span className={styles.prefPills}>
                      {[prefs.feeling, prefs.pace, prefs.depth, prefs.era].map((v) => (
                        <span key={v} className={styles.prefPill}>{v}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.grid}>
                {movies.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    className={styles.col6}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07, ease: 'easeOut' }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.shuffleBtn}
                  onClick={reshuffle}
                  disabled={reshuffling}
                >
                  {reshuffling ? 'Finding more…' : 'Show me different picks'}
                </button>
                <button className={styles.startOver} onClick={() => navigate('/')}>
                  Start over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
