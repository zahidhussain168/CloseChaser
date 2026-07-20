/**
 * Hand-authored Supabase schema types (Phase 1). Kept in sync with
 * supabase/migrations/0001_init.sql. Regenerate with the Supabase CLI later
 * if the schema grows.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          accent_color: string;
          reply_to: string | null;
          logo_url: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          accent_color?: string;
          reply_to?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["firms"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          firm_id: string;
          name: string;
          email: string;
          phone: string | null;
          qbo_realm_id: string | null;
          default_template_id: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          firm_id: string;
          name: string;
          email: string;
          phone?: string | null;
          qbo_realm_id?: string | null;
          default_template_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      request_templates: {
        Row: { id: string; firm_id: string; name: string } & Timestamps;
        Insert: { id?: string; firm_id: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["request_templates"]["Insert"]>;
        Relationships: [];
      };
      template_items: {
        Row: {
          id: string;
          template_id: string;
          type: "transaction" | "document";
          title: string;
          note: string | null;
          position: number;
        } & Timestamps;
        Insert: {
          id?: string;
          template_id: string;
          type?: "transaction" | "document";
          title: string;
          note?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["template_items"]["Insert"]>;
        Relationships: [];
      };
      close_periods: {
        Row: {
          id: string;
          client_id: string;
          month: string;
          status: "open" | "chasing" | "closed";
          chase_started_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          client_id: string;
          month: string;
          status?: "open" | "chasing" | "closed";
          chase_started_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["close_periods"]["Insert"]>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          close_period_id: string;
          type: "transaction" | "document";
          source: "qbo" | "manual";
          qbo_txn_id: string | null;
          title: string;
          details: Json;
          state: "requested" | "nudged" | "answered" | "accepted";
          answer_text: string | null;
          attachments: Json;
          answered_at: string | null;
          accepted_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          close_period_id: string;
          type: "transaction" | "document";
          source?: "qbo" | "manual";
          qbo_txn_id?: string | null;
          title: string;
          details?: Json;
          state?: "requested" | "nudged" | "answered" | "accepted";
          answer_text?: string | null;
          attachments?: Json;
          answered_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
      };
      magic_links: {
        Row: {
          id: string;
          client_id: string;
          token: string;
          expires_at: string;
          last_opened_at: string | null;
          revoked_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          client_id: string;
          token: string;
          expires_at: string;
          last_opened_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["magic_links"]["Insert"]>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          client_id: string;
          close_period_id: string;
          level: number;
          channel: "email" | "manual_text";
          scheduled_for: string;
          sent_at: string | null;
          stopped_reason: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          client_id: string;
          close_period_id: string;
          level: number;
          channel?: "email" | "manual_text";
          scheduled_for?: string;
          sent_at?: string | null;
          stopped_reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          firm_id: string;
          kind: "initial" | "level1" | "level2" | "level3" | "level4";
          subject: string;
          body: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          kind: "initial" | "level1" | "level2" | "level3" | "level4";
          subject: string;
          body: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_templates"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
