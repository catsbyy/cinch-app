import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isHost } from '../lib/storage';
import type { Room, Preference } from '../types';

interface UseRoomResult {
  room: Room | null;
  preferences: Preference[];
  isHostUser: boolean;
  loading: boolean;
  error: string | null;
  closeRoom: () => Promise<void>;
}

export function useRoom(code: string): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (cancelled) return;

      if (roomError || !roomData) {
        setError('Room not found.');
        setLoading(false);
        return;
      }

      const roomRecord = roomData as Room;
      setRoom(roomRecord);

      const { data: prefsData } = await supabase
        .from('preferences')
        .select('*')
        .eq('room_id', roomRecord.id);

      if (cancelled) return;

      setPreferences((prefsData as Preference[]) ?? []);
      setLoading(false);

      // Subscribe to new preference inserts
      const prefsSeen = new Set<string>(((prefsData as Preference[]) ?? []).map((p) => p.id));

      const prefsChannel = supabase
        .channel(`room-prefs-${roomRecord.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'preferences', filter: `room_id=eq.${roomRecord.id}` },
          (payload) => {
            const newPref = payload.new as Preference;
            if (!prefsSeen.has(newPref.id)) {
              prefsSeen.add(newPref.id);
              setPreferences((prev) => [...prev, newPref]);
            }
          }
        )
        .subscribe();

      // Subscribe to room status updates
      const roomChannel = supabase
        .channel(`room-status-${roomRecord.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomRecord.id}` },
          (payload) => {
            setRoom(payload.new as Room);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(prefsChannel);
        supabase.removeChannel(roomChannel);
      };
    }

    const cleanupPromise = load();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [code]);

  async function closeRoom() {
    if (!room) return;
    await supabase.from('rooms').update({ status: 'closed' }).eq('id', room.id);
  }

  return {
    room,
    preferences,
    isHostUser: isHost(code),
    loading,
    error,
    closeRoom,
  };
}
