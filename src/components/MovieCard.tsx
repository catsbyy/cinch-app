import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/tmdb';
import type { EnrichedMovie } from '../types';
import styles from './MovieCard.module.css';

interface Props {
  movie: EnrichedMovie;
}

export function MovieCard({ movie }: Props) {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const rating = movie.vote_average.toFixed(1);
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.top}>
        {movie.poster_path && (
          <img
            className={styles.poster}
            src={getImageUrl(movie.poster_path)}
            alt={movie.title}
            loading="lazy"
          />
        )}
        <div className={styles.meta}>
          <div className={styles.title}>{movie.title}</div>
          <div className={styles.subline}>
            {year && <span>{year}</span>}
            {runtime && <span className={styles.dot}>·</span>}
            {runtime && <span>{runtime}</span>}
          </div>
          <div className={styles.rating}>★ {rating}</div>
          {movie.genres.length > 0 && (
            <div className={styles.genres}>
              {movie.genres.slice(0, 3).map((g) => (
                <span key={g.id} className={styles.genre}>
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {movie.overview && (
        <p className={styles.overview}>{movie.overview}</p>
      )}

      {movie.providers.length > 0 && (
        <div className={styles.streaming}>
          {movie.providers.slice(0, 4).map((p) => (
            <img
              key={p.provider_id}
              className={styles.providerLogo}
              src={getImageUrl(p.logo_path, 'original')}
              alt={p.provider_name}
              title={p.provider_name}
            />
          ))}
        </div>
      )}

      <div className={styles.accent} aria-hidden />
    </motion.div>
  );
}
