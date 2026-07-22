import { apiFetch } from "./http";
import type { Client, Item, ClosePeriod } from "@/lib/types";
import type { ClientWithBlocking, CloseRollup, TemplateWithItems } from "@/lib/data";
import type { GeneratedSet } from "@/lib/ai/emails";
import type { Firm } from "@/lib/types";

type EmailKind = "initial" | "level1" | "level2" | "level3" | "level4";

/**
 * Typed calls against the standalone API, grouped by resource. Each takes the
 * caller's access token. Server code uses getServerToken(); client code uses
 * getBrowserToken(). Response shapes mirror the API's JSON envelopes.
 */

export const clientsApi = {
  list: (token: string | null) => apiFetch<{ clients: Client[] }>("/api/clients", { token }).then((r) => r.clients),
  get: (token: string | null, id: string) => apiFetch<{ client: Client }>(`/api/clients/${id}`, { token }).then((r) => r.client),
  create: (token: string | null, body: { name: string; email: string; phone?: string | null }) =>
    apiFetch<{ client: Client }>("/api/clients", { method: "POST", body, token }).then((r) => r.client),
  update: (token: string | null, id: string, body: Partial<{ name: string; email: string; phone: string | null }>) =>
    apiFetch<{ client: Client }>(`/api/clients/${id}`, { method: "PATCH", body, token }).then((r) => r.client),
  remove: (token: string | null, id: string) => apiFetch<void>(`/api/clients/${id}`, { method: "DELETE", token }),
};

export type Checklist = {
  client: Client;
  period: ClosePeriod;
  items: Item[];
  openCount: number;
  link: { url: string; openedAt: string | null } | null;
};

export const closeApi = {
  checklist: (token: string | null, clientId: string) => apiFetch<Checklist>(`/api/clients/${clientId}/checklist`, { token }),
  addItem: (
    token: string | null,
    clientId: string,
    body: { type: "transaction" | "document" | "questionnaire"; title: string; note?: string; questions?: string[] },
  ) => apiFetch<{ item: Item }>(`/api/clients/${clientId}/items`, { method: "POST", body, token }).then((r) => r.item),
  chase: (token: string | null, clientId: string) =>
    apiFetch<{ ok: boolean; sent: boolean; link: string; error?: string }>(`/api/clients/${clientId}/chase`, { method: "POST", token }),
  link: (token: string | null, clientId: string) => apiFetch<{ url: string }>(`/api/clients/${clientId}/link`, { token }).then((r) => r.url),
  regenerateLink: (token: string | null, clientId: string) =>
    apiFetch<{ url: string }>(`/api/clients/${clientId}/link/regenerate`, { method: "POST", token }).then((r) => r.url),
};

export const itemsApi = {
  accept: (token: string | null, id: string) => apiFetch<{ item: Item }>(`/api/items/${id}/accept`, { method: "POST", token }).then((r) => r.item),
  reopen: (token: string | null, id: string) => apiFetch<{ item: Item }>(`/api/items/${id}/reopen`, { method: "POST", token }).then((r) => r.item),
  remove: (token: string | null, id: string) => apiFetch<void>(`/api/items/${id}`, { method: "DELETE", token }),
};

export const dashboardApi = {
  get: (token: string | null) =>
    apiFetch<{ clients: ClientWithBlocking[]; rollup: CloseRollup }>("/api/dashboard", { token }),
};

export const firmApi = {
  get: (token: string | null) => apiFetch<{ firm: Firm }>("/api/firm", { token }).then((r) => r.firm),
  updateBranding: (token: string | null, body: { name: string; accent_color: string; reply_to?: string }) =>
    apiFetch<{ ok: true }>("/api/firm/branding", { method: "PATCH", body, token }),
  updateCadence: (token: string | null, body: { offsets: number[]; weeklyStep: number }) =>
    apiFetch<{ ok: true }>("/api/firm/cadence", { method: "PATCH", body, token }),
  updateEmailTemplate: (token: string | null, kind: EmailKind, body: { subject: string; body: string }) =>
    apiFetch<{ ok: true }>(`/api/firm/email-templates/${kind}`, { method: "PUT", body, token }),
};

export const templatesApi = {
  list: (token: string | null) => apiFetch<{ templates: TemplateWithItems[] }>("/api/templates", { token }).then((r) => r.templates),
  create: (token: string | null, name: string) => apiFetch<{ template: unknown }>("/api/templates", { method: "POST", body: { name }, token }),
  addStarter: (token: string | null, key: string) => apiFetch<{ ok: true }>("/api/templates/starter", { method: "POST", body: { key }, token }),
  remove: (token: string | null, id: string) => apiFetch<void>(`/api/templates/${id}`, { method: "DELETE", token }),
  addItem: (token: string | null, templateId: string, body: { type: "transaction" | "document"; title: string; note?: string }) =>
    apiFetch<{ item: unknown }>(`/api/templates/${templateId}/items`, { method: "POST", body, token }),
  removeItem: (token: string | null, id: string) => apiFetch<void>(`/api/templates/items/${id}`, { method: "DELETE", token }),
  apply: (token: string | null, templateId: string, clientId: string) =>
    apiFetch<{ ok: boolean; added: number }>(`/api/templates/${templateId}/apply`, { method: "POST", body: { clientId }, token }),
  setDefault: (token: string | null, clientId: string, templateId: string | null) =>
    apiFetch<{ ok: true }>(`/api/clients/${clientId}/default-template`, { method: "POST", body: { templateId }, token }),
};

export const aiApi = {
  generate: (token: string | null, voice: string, tone: string) =>
    apiFetch<{ templates: GeneratedSet }>("/api/ai/generate-emails", { method: "POST", body: { voice, tone }, token }).then((r) => r.templates),
  save: (token: string | null, templates: GeneratedSet) =>
    apiFetch<{ ok: true }>("/api/ai/save-emails", { method: "POST", body: { templates }, token }),
};

export const billingApi = {
  status: (token: string | null) =>
    apiFetch<{ status: string; active: boolean; inTrial: boolean; trialDaysLeft: number; trialEndsAt: string | null; currentPeriodEnd: string | null; hasSubscription: boolean }>(
      "/api/billing/status",
      { token },
    ),
  checkout: (token: string | null) =>
    apiFetch<{ ok: true; customerId: string; firmId: string; email: string }>("/api/billing/checkout", { method: "POST", token }),
  portal: (token: string | null) => apiFetch<{ url: string }>("/api/billing/portal", { method: "POST", token }).then((r) => r.url),
};

export const qboApi = {
  status: (token: string | null) =>
    apiFetch<{ connected: boolean; realmId: string | null; companyName: string | null }>("/api/qbo/status", { token }),
  connectUrl: (token: string | null) => apiFetch<{ url: string }>("/api/qbo/connect", { token }).then((r) => r.url),
  import: (token: string | null, clientId: string) =>
    apiFetch<{ ok: boolean; added: number }>("/api/qbo/import", { method: "POST", body: { clientId }, token }),
};
