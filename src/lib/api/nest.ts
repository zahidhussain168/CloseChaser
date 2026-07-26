import { authHeaders } from "./fetcher";
import { isNestApiEnabled } from "./config";
import { clientsControllerList, clientsControllerGet, clientsControllerDetail } from "./generated/clients/clients";
import { itemsControllerList } from "./generated/items/items";
import { billingControllerEntitlements } from "./generated/billing/billing";
import { remindersControllerHistory } from "./generated/reminders/reminders";
import { dashboardControllerGet } from "./generated/dashboard/dashboard";
import { templatesControllerList } from "./generated/templates/templates";
import { firmControllerGet, firmControllerUpdateBranding } from "./generated/firm/firm";
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
  },

  items: {
    forClient: async (token: string | null, clientId: string) =>
      (await itemsControllerList(clientId, opts(token))).data,
  },

  billing: {
    entitlements: async (token: string | null) =>
      (await billingControllerEntitlements(opts(token))).data,
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
  },
};

export type { ClientResponse, ItemResponse, EntitlementsResponse, ReminderResponse }
  from "./generated/ruledOffAPI.schemas";
