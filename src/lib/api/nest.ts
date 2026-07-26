import { authHeaders } from "./fetcher";
import { isNestApiEnabled } from "./config";
import {
  clientsControllerList, clientsControllerGet, clientsControllerDetail,
  clientsControllerCreate, clientsControllerUpdate, clientsControllerRemove,
} from "./generated/clients/clients";
import { itemsControllerList } from "./generated/items/items";
import { billingControllerEntitlements } from "./generated/billing/billing";
import { remindersControllerHistory } from "./generated/reminders/reminders";
import { dashboardControllerGet } from "./generated/dashboard/dashboard";
import {
  templatesControllerList, templatesControllerCreate, templatesControllerCreateWithItems,
  templatesControllerAddItem, templatesControllerRemoveItem, templatesControllerRemove,
  templatesControllerApply, templatesControllerSetDefault, templatesControllerUpsertEmailTemplate,
} from "./generated/templates/templates";
import {
  itemsControllerCreate, itemsControllerRemove, itemsControllerAnnotate,
} from "./generated/items/items";
import {
  clientsControllerEnsureLink, clientsControllerRegenerateLink, clientsControllerSetAutoChase,
} from "./generated/clients/clients";
import { chaseControllerFire } from "./generated/chase/chase";
import { aiControllerChaseEmails, aiControllerInsight } from "./generated/ai/ai";
import { billingControllerCheckout, billingControllerPortal } from "./generated/billing/billing";
import { qboControllerStatus, qboControllerDisconnect, qboImportControllerImport } from "./generated/qbo/qbo";
import {
  firmControllerGet, firmControllerUpdateBranding, firmControllerUpdateCadence,
} from "./generated/firm/firm";
import type { ClientWithBlocking, CloseRollup, ClientDetail, TemplateWithItems } from "@/lib/data";
import type { Firm } from "@/lib/types";

/**
 * A thin, readable face over the generated client.
 *
 * The generated names are long and carry an envelope, which is fine for machine
 * output but noisy at a call site. This unwraps `.data`, takes the caller's
 * access token, and is the ONLY place app code should import the API from, so
 * regenerating the client never ripples through pages.
 *
 * Everything here is opt-in and uses its OWN switch, NEXT_PUBLIC_NEST_API_URL,
 * separate from the old NEXT_PUBLIC_API_URL that the server actions read. The
 * two APIs do not share routes or response shapes, so one flag could not safely
 * govern both.
 */
const opts = (token: string | null): RequestInit => ({ headers: authHeaders(token) });

export const nestApi = {
  enabled: isNestApiEnabled,

  clients: {
    list: async (token: string | null) => (await clientsControllerList(opts(token))).data,
    get: async (token: string | null, id: string) =>
      (await clientsControllerGet(id, opts(token))).data,
    // Returns the full ClientDetail shape (a port of getClientDetail). The
    // caller maps a 404 to null, matching the old behaviour for a missing client.
    detail: async (token: string | null, id: string) =>
      (await clientsControllerDetail(id, opts(token))).data as unknown as ClientDetail,
    create: async (
      token: string | null,
      body: { name: string; email: string; phone?: string; qboRealmId?: string },
    ) => (await clientsControllerCreate(body, opts(token))).data as unknown as { id: string },
    update: async (
      token: string | null,
      id: string,
      // closeDay null clears it; the old direct write cleared it when the form
      // field was blank, so the migrated write must be able to as well.
      body: { name?: string; email?: string; phone?: string; notes?: string; closeDay?: number | null },
    ) => (await clientsControllerUpdate(id, body as Record<string, unknown>, opts(token))).data,
    remove: async (token: string | null, id: string) =>
      (await clientsControllerRemove(id, opts(token))).data,
    ensureLink: async (token: string | null, id: string) =>
      (await clientsControllerEnsureLink(id, opts(token))).data as unknown as { token: string },
    regenerateLink: async (token: string | null, id: string) =>
      (await clientsControllerRegenerateLink(id, opts(token))).data as unknown as { token: string },
    setAutoChase: async (token: string | null, id: string, on: boolean) =>
      (await clientsControllerSetAutoChase(id, { on }, opts(token))).data,
    chase: async (token: string | null, id: string) =>
      (await chaseControllerFire(id, opts(token))).data as unknown as { ok: boolean; error?: string },
  },

  items: {
    forClient: async (token: string | null, clientId: string) =>
      (await itemsControllerList(clientId, opts(token))).data,
    add: async (
      token: string | null,
      clientId: string,
      body: { type: string; title: string; note?: string; questions?: string[] },
    ) => (await itemsControllerCreate(clientId, body as never, opts(token))).data,
    remove: async (token: string | null, id: string) =>
      (await itemsControllerRemove(id, opts(token))).data,
    annotate: async (token: string | null, clientId: string, title: string, note: string) =>
      (await itemsControllerAnnotate(clientId, { title, note } as never, opts(token))).data,
  },

  templatesWrite: {
    create: async (token: string | null, name: string) =>
      (await templatesControllerCreate({ name }, opts(token))).data as unknown as { id: string },
    createWithItems: async (
      token: string | null,
      name: string,
      items: { type: string; title: string; note?: string }[],
    ) => (await templatesControllerCreateWithItems({ name, items } as never, opts(token))).data,
    addItem: async (
      token: string | null,
      templateId: string,
      body: { type: string; title: string; note?: string },
    ) => (await templatesControllerAddItem(templateId, body as never, opts(token))).data,
    removeItem: async (token: string | null, itemId: string) =>
      (await templatesControllerRemoveItem(itemId, opts(token))).data,
    remove: async (token: string | null, id: string) =>
      (await templatesControllerRemove(id, opts(token))).data,
    apply: async (token: string | null, templateId: string, clientId: string) =>
      (await templatesControllerApply(templateId, { clientId }, opts(token))).data as unknown as { added: number },
    setDefault: async (token: string | null, clientId: string, templateId: string | null) =>
      (await templatesControllerSetDefault(clientId, { templateId } as never, opts(token))).data,
    upsertEmailTemplate: async (
      token: string | null,
      kind: string,
      subject: string,
      body: string,
    ) => (await templatesControllerUpsertEmailTemplate({ kind, subject, body } as never, opts(token))).data,
  },

  billing: {
    entitlements: async (token: string | null) =>
      (await billingControllerEntitlements(opts(token))).data,
    checkout: async (token: string | null) =>
      (await billingControllerCheckout(opts(token))).data as unknown as {
        ok: true; customerId: string; firmId: string; email: string;
      },
    portal: async (token: string | null) =>
      (await billingControllerPortal(opts(token))).data as unknown as { url: string | null },
  },

  qbo: {
    status: async (token: string | null) =>
      (await qboControllerStatus(opts(token))).data as unknown as {
        connected: boolean; realmId: string | null; companyName: string | null;
      },
    import: async (token: string | null, clientId: string) =>
      (await qboImportControllerImport(clientId, opts(token))).data as unknown as {
        ok: boolean; added: number; skipped: number;
      },
    disconnect: async (token: string | null) =>
      (await qboControllerDisconnect(opts(token))).data,
  },

  ai: {
    chaseEmails: async (token: string | null, voice: string, tone: string) =>
      (await aiControllerChaseEmails({ voice, tone } as never, opts(token))).data as unknown as
        Record<string, { subject: string; body: string }>,
    insight: async (token: string | null, clientId: string) =>
      (await aiControllerInsight(clientId, opts(token))).data,
  },

  reminders: {
    history: async (token: string | null, clientId: string) =>
      (await remindersControllerHistory(clientId, opts(token))).data,
  },

  dashboard: {
    // The endpoint returns exactly this shape (a port of the old query), and
    // ClientWithBlocking / CloseRollup are the app's canonical types, so we
    // assert to them here rather than duplicate them as Nest DTOs.
    get: async (token: string | null) =>
      (await dashboardControllerGet(opts(token))).data as unknown as {
        clients: ClientWithBlocking[];
        rollup: CloseRollup;
      },
  },

  templates: {
    list: async (token: string | null) =>
      (await templatesControllerList(opts(token))).data as unknown as TemplateWithItems[],
  },

  firm: {
    // Returns the full firm row. The caller maps 401/404 to null, matching the
    // old "no session / no firm" behaviour.
    get: async (token: string | null) =>
      (await firmControllerGet(opts(token))).data as unknown as Firm,
    updateBranding: async (
      token: string | null,
      body: { name: string; accent_color: string; reply_to?: string },
    ) => (await firmControllerUpdateBranding(body, opts(token))).data as unknown as Firm,
    updateCadence: async (
      token: string | null,
      body: { offsets: number[]; weeklyStep: number },
    ) => (await firmControllerUpdateCadence(body, opts(token))).data as unknown as Firm,
  },
};

export type { ClientResponse, ItemResponse, EntitlementsResponse, ReminderResponse }
  from "./generated/ruledOffAPI.schemas";
