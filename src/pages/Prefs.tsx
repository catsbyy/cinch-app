import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getOrCreateParticipantId } from '../lib/storage';
import { ChoiceCard } from '../components/ChoiceCard';
import { PreferenceStep } from '../components/PreferenceStep';
import type { Feeling, Pace, Depth, Era } from '../types';
import styles from './Prefs.module.css';

const TOTAL_STEPS = 4;

export default function Prefs() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const solo = (location.state as { solo?: boolean } | null)?.solo ?? false;

  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);
  const [depth, setDepth] = useState<Depth | null>(null);
  const [era, setEra] = useState<Era | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single()
      .then(({ data }) => {
        if (data) setRoomId((data as { id: string }).id);
      });
  }, [code]);

  function advance() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function selectFeeling(value: Feeling) {
    setFeeling(value);
    setTimeout(advance, 200);
  }

  function selectPace(value: Pace) {
    setPace(value);
    setTimeout(advance, 200);
  }

  function selectDepth(value: Depth) {
    setDepth(value);
    setTimeout(advance, 200);
  }

  async function handleSubmit(selectedEra: Era) {
    setEra(selectedEra);
    if (!roomId || !feeling || !pace || !depth) return;

    setSubmitting(true);
    setSubmitError(null);

    const participantId = getOrCreateParticipantId();

    const { error } = await supabase.from('preferences').insert({
      room_id: roomId,
      participant_id: participantId,
      feeling,
      pace,
      depth,
      era: selectedEra,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError('Could not save preferences. Please try again.');
      return;
    }

    if (solo) {
      navigate(`/room/${code}/results`, { state: { solo: true } });
    } else {
      navigate(`/room/${code}`);
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40, filter: 'blur(4px)' },
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -40, filter: 'blur(4px)' },
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className={styles.stepCounter}>
          {step + 1} / {TOTAL_STEPS}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Feeling */}
          {step === 0 && (
            <motion.div
              key="feeling"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <PreferenceStep
                title="How are you feeling?"
                hint="Choose the emotional color of your evening."
              >
                <div className={styles.grid}>
                  <div className={styles.col6}>
                    <ChoiceCard title="Melancholic" subtitle="Quiet, reflective, moonlit" icon="🌙" selected={feeling === 'melancholic'} onClick={() => selectFeeling('melancholic')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Calm" subtitle="Soft, warm, unhurried" icon="🌿" selected={feeling === 'calm'} onClick={() => selectFeeling('calm')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Intense" subtitle="Sharp focus, tension, adrenaline" icon="⚡" selected={feeling === 'intense'} onClick={() => selectFeeling('intense')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Hopeful" subtitle="Light ahead, gentle uplift" icon="✨" selected={feeling === 'hopeful'} onClick={() => selectFeeling('hopeful')} />
                  </div>
                </div>
              </PreferenceStep>
            </motion.div>
          )}

          {/* Step 1: Pace */}
          {step === 1 && (
            <motion.div
              key="pace"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <PreferenceStep
                title="What pace do you want?"
                hint="How fast should the story breathe?"
              >
                <div className={styles.grid}>
                  <div className={styles.col4}>
                    <ChoiceCard title="Slow burn" subtitle="Atmosphere first" icon="🕯️" selected={pace === 'slow'} onClick={() => selectPace('slow')} />
                  </div>
                  <div className={styles.col4}>
                    <ChoiceCard title="Balanced" subtitle="A steady rhythm" icon="⚖️" selected={pace === 'balanced'} onClick={() => selectPace('balanced')} />
                  </div>
                  <div className={styles.col4}>
                    <ChoiceCard title="Dynamic" subtitle="Keep it moving" icon="🎯" selected={pace === 'dynamic'} onClick={() => selectPace('dynamic')} />
                  </div>
                </div>
              </PreferenceStep>
            </motion.div>
          )}

          {/* Step 2: Depth */}
          {step === 2 && (
            <motion.div
              key="depth"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <PreferenceStep
                title="How deep should it go?"
                hint="Comforting or thought-provoking?"
              >
                <div className={styles.grid}>
                  <div className={styles.col6}>
                    <ChoiceCard title="Light" subtitle="Comfort, warmth, simple joy" icon="☁️" selected={depth === 'light'} onClick={() => selectDepth('light')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Deep" subtitle="Meaning, symbolism, quiet weight" icon="🌊" selected={depth === 'deep'} onClick={() => selectDepth('deep')} />
                  </div>
                </div>
              </PreferenceStep>
            </motion.div>
          )}

          {/* Step 3: Era */}
          {step === 3 && (
            <motion.div
              key="era"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <PreferenceStep
                title="What era?"
                hint="When was it made?"
              >
                <div className={styles.grid}>
                  <div className={styles.col6}>
                    <ChoiceCard title="Classic" subtitle="Before 2000" icon="📽️" selected={era === 'classic'} onClick={() => handleSubmit('classic')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Mid" subtitle="2000–2015" icon="🎬" selected={era === 'mid'} onClick={() => handleSubmit('mid')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Recent" subtitle="2015 to now" icon="🎞️" selected={era === 'recent'} onClick={() => handleSubmit('recent')} />
                  </div>
                  <div className={styles.col6}>
                    <ChoiceCard title="Any era" subtitle="Doesn't matter" icon="🎭" selected={era === 'any'} onClick={() => handleSubmit('any')} />
                  </div>
                </div>

                {submitError && (
                  <p className={styles.error}>{submitError}</p>
                )}
              </PreferenceStep>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        {step > 0 && !submitting && (
          <motion.button
            className={styles.backBtn}
            onClick={() => setStep((s) => s - 1)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            ← Back
          </motion.button>
        )}

        {/* Submitting overlay */}
        <AnimatePresence>
          {submitting && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.loader}>
                <div className={styles.loaderTitle}>Saving your picks…</div>
                <div className={styles.loaderHint}>Just a moment.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
