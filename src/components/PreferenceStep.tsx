import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  hint: string;
  children: ReactNode;
}

export function PreferenceStep({ title, hint, children }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 650,
          margin: '0 0 4px',
          letterSpacing: '-0.2px',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--muted)',
          margin: '0 0 14px',
        }}
      >
        {hint}
      </p>
      {children}
    </motion.section>
  );
}
