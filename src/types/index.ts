export type Feeling = 'melancholic' | 'calm' | 'intense' | 'hopeful';
export type Pace = 'slow' | 'balanced' | 'dynamic';
export type Depth = 'light' | 'deep';
export type Era = 'classic' | 'mid' | 'recent' | 'any';

export interface RoomResults {
  movies: EnrichedMovie[];
  prefs: UserPrefs;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: 'waiting' | 'active' | 'closed';
  expires_at: string;
  created_at: string;
  results: RoomResults | null;
}

export interface Preference {
  id: string;
  room_id: string;
  participant_id: string;
  feeling: Feeling;
  pace: Pace;
  depth: Depth;
  era: Era;
  submitted_at: string;
}

export interface UserPrefs {
  feeling: Feeling;
  pace: Pace;
  depth: Depth;
  era: Era;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface EnrichedMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
  genres: { id: number; name: string }[];
  runtime: number | null;
  providers: StreamingProvider[];
}
