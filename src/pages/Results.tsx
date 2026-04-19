import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { isHost } from '../lib/storage';
import { computeOverlap } from '../lib/overlap';
import { getEnrichedMovies } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import type { Preference, EnrichedMovie, UserPrefs, RoomResults } from '../types';
import styles from './Results.module.css';

export default function Results() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const solo = (location.state as { solo?: boolean } | null)?.solo ?? false;

  const [movies, setMovies] = useState<EnrichedMovie[]>([]);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  // true while host is computing or non-host is waiting for host
  const [loading, setLoading] = useState(true);
  // true only while the host is actively calling TMDB (shows specific message)
  const [computing, setComputing] = useState(false);
  const [reshuffling, setReshuffling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  function applyResults(data: RoomResults) {
    setMovies(data.movies);
    setPrefs(data.prefs);
  }

  function subscribeToRoom(roomId: string) {
    if (channelRef.current) return; // already subscribed
    const channel = supabase
      .channel(`results-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as { results?: RoomResults | null };
          if (updated.results) {
            // Scroll all clients to top whenever results change (Bug 2)
            window.scrollTo({ top: 0, behavior: 'smooth' });
            applyResults(updated.results);
            setLoading(false);
            setComputing(false);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: fetch room, including any already-written results
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('id, results')
          .eq('code', code)
          .single();

        if (cancelled) return;

        if (roomError || !roomData) {
          setError('Room not found.');
          setLoading(false);
          return;
        }

        const { id: roomId, results: cachedResults } = roomData as {
          id: string;
          results: RoomResults | null;
        };
        roomIdRef.current = roomId;

        // Step 2: results already in DB — display immediately, no TMDB call
        if (cachedResults) {
          applyResults(cachedResults);
          setLoading(false);
          subscribeToRoom(roomId); // stay subscribed for reshuffles
          return;
        }

        // Step 3: results not yet written — subscribe first so we don't miss the write
        subscribeToRoom(roomId);

        // Non-host: wait silently; the realtime handler will call applyResults + setLoading(false)
        if (!isHost(code ?? '')) {
          // intentionally leave loading = true — subscription resolves it
          return;
        }

        // Host only: compute overlap → call TMDB → write to DB
        setComputing(true);

        const { data: prefsData, error: prefsError } = await supabase
          .from('preferences')
          .select('*')
          .eq('room_id', roomId);

        if (cancelled) return;
        if (prefsError) throw prefsError;

        const prefsList = (prefsData as Preference[]) ?? [];

        if (prefsList.length === 0) {
          setError('No preferences submitted yet. Try going back to the room.');
          setLoading(false);
          setComputing(false);
          return;
        }

        const userPrefs = computeOverlap(prefsList);
        const enriched = await getEnrichedMovies(userPrefs);

        if (cancelled) return;

        const roomResults: RoomResults = { movies: enriched, prefs: userPrefs };

        // Write to DB — the realtime subscription fires for all clients (including this one)
        // and they all call applyResults + setLoading(false) there.
        // Guard with .is('results', null) so a race between two hosts can't double-write.
        await supabase
          .from('rooms')
          .update({ results: roomResults })
          .eq('id', roomId)
          .is('results', null);

        // Apply locally in case the realtime event doesn't fire on the writer's own connection
        if (!cancelled) {
          applyResults(roomResults);
          setLoading(false);
          setComputing(false);
        }
      } catch {
        if (!cancelled) {
          setError('Something went wrong. Please try again.');
          setLoading(false);
          setComputing(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [code]);

  async function reshuffle() {
    if (!prefs || !roomIdRef.current) return;
    setReshuffling(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const enriched = await getEnrichedMovies(prefs);
      const roomResults: RoomResults = { movies: enriched, prefs };
      // Writing to DB triggers the realtime handler on all clients, which scrolls + renders
      await supabase
        .from('rooms')
        .update({ results: roomResults })
        .eq('id', roomIdRef.current);
      // Apply locally in case realtime doesn't echo back to the writer
      setMovies(enriched);
    } finally {
      setReshuffling(false);
    }
  }

  // Loading message varies by role
  const loadingTitle = computing ? 'Finding your films…' : 'Waiting for results…';
  const loadingHint = computing ? 'Let the mood settle.' : 'The host is picking your films.';

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
                <div className={styles.loaderTitle}>{loadingTitle}</div>
                <div className={styles.loaderHint}>{loadingHint}</div>
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
                  {solo ? 'Here are your picks' : "Here's what works for everyone"}
                </h1>
                <div className={styles.hintRow}>
                  <span className={styles.hint}>
                    {solo ? 'Based on your mood.' : "Based on everyone's preferences."}
                  </span>
                  {prefs && (
                    <span className={styles.prefPills}>
                      {([prefs.feeling, prefs.pace, prefs.depth, prefs.era] as string[]).map((v) => (
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
