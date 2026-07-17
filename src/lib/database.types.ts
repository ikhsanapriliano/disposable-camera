export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          nama_acara: string;
          tanggal_acara: string | null;
          waktu_reveal: string;
          link_token: string;
          created_at: string;
          is_revealed: boolean;
        };
        Insert: {
          id?: string;
          nama_acara: string;
          tanggal_acara?: string | null;
          waktu_reveal: string;
          link_token: string;
          created_at?: string;
          is_revealed?: boolean;
        };
        Update: {
          id?: string;
          nama_acara?: string;
          tanggal_acara?: string | null;
          waktu_reveal?: string;
          link_token?: string;
          created_at?: string;
          is_revealed?: boolean;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          event_id: string;
          url_foto: string;
          guest_session_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          url_foto: string;
          guest_session_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          url_foto?: string;
          guest_session_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      voice_notes: {
        Row: {
          id: string;
          event_id: string;
          url_audio: string;
          guest_session_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          url_audio: string;
          guest_session_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          url_audio?: string;
          guest_session_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}