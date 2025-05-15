import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          deck_id: string;
          front_text: string;
          back_text: string;
          interval: number;
          next_review: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          front_text: string;
          back_text: string;
          interval: number;
          next_review: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          front_text?: string;
          back_text?: string;
          interval?: number;
          next_review?: string;
          created_at?: string;
        };
      };
    };
  };
}; 