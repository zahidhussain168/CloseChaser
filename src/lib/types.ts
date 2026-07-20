/** Shared domain types for RuledOff (Phase 1). */

export type ItemType = "transaction" | "document";
export type ItemSource = "qbo" | "manual";

/** The item lifecycle: requested → nudged → answered → accepted. */
export type ItemState = "requested" | "nudged" | "answered" | "accepted";

export type ReminderLevel = 1 | 2 | 3 | 4; // 1=friendly, 2=specific, 3=consequence, 4=weekly
export type ReminderChannel = "email" | "manual_text";
export type ClosePeriodStatus = "open" | "chasing" | "closed";

export type Attachment = {
  path: string; // storage object path in the private bucket
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
  created_at: string;
  paddle_customer_id?: string | null;
  paddle_subscription_id?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
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

export type RequestTemplate = {
  id: string;
  firm_id: string;
  name: string;
  created_at: string;
};

export type TemplateItem = {
  id: string;
  template_id: string;
  type: ItemType;
  title: string;
  note: string | null;
  position: number;
  created_at: string;
};

export type ClosePeriod = {
  id: string;
  client_id: string;
  month: string; // 'YYYY-MM-01'
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
  /** When the answer was pushed back to QuickBooks, and why it last failed. */
  qbo_synced_at: string | null;
  qbo_sync_error: string | null;
  created_at: string;
};

export type MagicLink = {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  last_opened_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type Reminder = {
  id: string;
  client_id: string;
  close_period_id: string;
  level: ReminderLevel;
  channel: ReminderChannel;
  scheduled_for: string;
  sent_at: string | null;
  stopped_reason: string | null;
  created_at: string;
};
