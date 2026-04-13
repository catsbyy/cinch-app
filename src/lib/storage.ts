const WORDS = ['AMBER', 'FOX', 'WOLF', 'JADE', 'NOVA', 'ONYX', 'SAGE', 'TEAL', 'RUBY', 'LUNA'];

export function getOrCreateParticipantId(): string {
  let id = localStorage.getItem('participant_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('participant_id', id);
  }
  return id;
}

export function getHostRooms(): string[] {
  try {
    return JSON.parse(localStorage.getItem('host_rooms') ?? '[]');
  } catch {
    return [];
  }
}

export function addHostRoom(code: string): void {
  const rooms = getHostRooms();
  if (!rooms.includes(code)) {
    rooms.push(code);
    localStorage.setItem('host_rooms', JSON.stringify(rooms));
  }
}

export function isHost(code: string): boolean {
  return getHostRooms().includes(code);
}

export function generateRoomCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10–99
  return `${word}-${num}`;
}
