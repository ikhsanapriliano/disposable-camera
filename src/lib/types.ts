export interface Event {
  id: string;
  nama_acara: string;
  tanggal_acara: string | null;
  waktu_reveal: string;
  link_token: string;
  created_at: string;
  is_revealed: boolean;
}

export interface Photo {
  id: string;
  event_id: string;
  url_foto: string;
  guest_session_id: string;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  event_id: string;
  url_audio: string;
  guest_session_id: string;
  created_at: string;
}