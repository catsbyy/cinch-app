import type { Feeling, Pace, Depth, Era, UserPrefs, EnrichedMovie, StreamingProvider } from '../types';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Genre ID mappings
const FEELING_GENRES: Record<Feeling, number[]> = {
  melancholic: [18, 10749],  // Drama, Romance
  calm:        [18, 16],     // Drama, Animation
  intense:     [53, 28],     // Thriller, Action
  hopeful:     [35, 16],     // Comedy, Animation
};

const PACE_GENRES: Record<Pace, number[]> = {
  slow:     [18],     // +Drama
  balanced: [],
  dynamic:  [28, 53], // +Action, Thriller
};

const DEPTH_GENRES: Record<Depth, number[]> = {
  light: [35, 16],      // +Comedy, Animation
  deep:  [18, 9648, 878], // +Drama, Mystery, Sci-Fi
};

const DEPTH_EXCLUDE: Record<Depth, number[]> = {
  light: [27], // Horror
  deep:  [],
};

const ERA_FILTERS: Record<Era, Record<string, string>> = {
  classic: { 'primary_release_date.lte': '1999-12-31' },
  mid:     { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2015-12-31' },
  recent:  { 'primary_release_date.gte': '2015-01-01' },
  any:     {},
};

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
}

export function buildDiscoverParams(prefs: UserPrefs): URLSearchParams {
  const genreSet = new Set<number>([
    ...FEELING_GENRES[prefs.feeling],
    ...PACE_GENRES[prefs.pace],
    ...DEPTH_GENRES[prefs.depth],
  ]);

  const excludeSet = new Set<number>(DEPTH_EXCLUDE[prefs.depth]);

  // Remove excluded genres
  for (const id of excludeSet) {
    genreSet.delete(id);
  }

  const params = new URLSearchParams({
    api_key: API_KEY,
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    with_original_language: 'en',
  });

  if (genreSet.size > 0) {
    params.set('with_genres', [...genreSet].join('|'));
  }

  const eraFilters = ERA_FILTERS[prefs.era];
  for (const [key, value] of Object.entries(eraFilters)) {
    params.set(key, value);
  }

  return params;
}

async function fetchMovieDetail(id: number): Promise<{ genres: { id: number; name: string }[]; runtime: number | null }> {
  const res = await fetch(`${BASE}/movie/${id}?api_key=${API_KEY}`);
  const data = await res.json() as { genres?: { id: number; name: string }[]; runtime?: number | null };
  return {
    genres: data.genres ?? [],
    runtime: data.runtime ?? null,
  };
}

async function fetchStreamingProviders(id: number): Promise<StreamingProvider[]> {
  const res = await fetch(`${BASE}/movie/${id}/watch/providers?api_key=${API_KEY}`);
  const data = await res.json() as { results?: { US?: { flatrate?: StreamingProvider[] } } };
  return data.results?.US?.flatrate ?? [];
}

interface DiscoverMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
}

export async function getEnrichedMovies(prefs: UserPrefs): Promise<EnrichedMovie[]> {
  const params = buildDiscoverParams(prefs);
  const res = await fetch(`${BASE}/discover/movie?${params.toString()}`);
  const data = await res.json() as { results?: DiscoverMovie[] };
  const pool = data.results ?? [];
  // Shuffle the pool (Fisher-Yates) then pick 5 so results vary each visit
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const top5 = pool.slice(0, 5);

  const enriched = await Promise.all(
    top5.map(async (movie) => {
      const [detail, providers] = await Promise.all([
        fetchMovieDetail(movie.id),
        fetchStreamingProviders(movie.id),
      ]);
      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
        genres: detail.genres,
        runtime: detail.runtime,
        providers,
      };
    })
  );

  return enriched;
}
