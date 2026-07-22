/** Domain types, mirrored from the RuledOff schema (Supabase). */

export type ItemType = "transaction" | "document" | "questionnaire";
export type ItemSource = "qbo" | "manual";
export type ItemState = "requested" | "nudged" | "answered" | "accepted";
export type ReminderLevel = 1 | 2 | 3 | 4;
export type ClosePeriodStatus = "open" | "chasing" | "closed";

export type Attachment = {
  path: string;
  name: string;
  size: number;
  mime: string;
  uploaded_at: string;
};

export type Firm = {
  id: string;
  owner_id: string;
  name: string;
  accent_color: string | null;
  reply_to: string | null;
  logo_url: string | null;
  reminder_offsets?: number[];
  reminder_weekly_step?: number;
  subscription_status?: string | null;
  paddle_subscription_id?: string | null;
  paddle_customer_id?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  firm_id: string;
  name: string;
  email: string;
  phone: string | null;
  qbo_realm_id: string | null;
  default_template_id: string | null;
  created_at: string;
};

export type ClosePeriod = {
  id: string;
  client_id: string;
  month: string;
  status: ClosePeriodStatus;
  chase_started_at: string | null;
  created_at: string;
};

export type Item = {
  id: string;
  close_period_id: string;
  type: ItemType;
  source: ItemSource;
  qbo_txn_id: string | null;
  title: string;
  details: Record<string, unknown>;
  state: ItemState;
  answer_text: string | null;
  attachments: Attachment[];
  answered_at: string | null;
  accepted_at: string | null;
  qbo_synced_at: string | null;
  qbo_sync_error: string | null;
  created_at: string;
};
