import { authHeaders } from "./fetcher";
import { isApiEnabled } from "./config";
import { clientsControllerList, clientsControllerGet } from "./generated/clients/clients";
import { itemsControllerList } from "./generated/items/items";
import { billingControllerEntitlements } from "./generated/billing/billing";
import { remindersControllerHistory } from "./generated/reminders/reminders";

/**
 * A thin, readable face over the generated client.
 *
 * The generated names are long and carry an envelope, which is fine for machine
 * output but noisy at a call site. This unwraps `.data`, takes the caller's
 * access token, and is the ONLY place app code should import the API from, so
 * regenerating the client never ripples through pages.
 *
 * Everything here is opt-in: when NEXT_PUBLIC_API_URL is unset, which is the
 * current default including production, nothing calls it and the app keeps
 * using its built-in server actions.
 */
const opts = (token: string | null): RequestInit => ({ headers: authHeaders(token) });

export const nestApi = {
  enabled: isApiEnabled,

  clients: {
    list: async (token: string | null) => (await clientsControllerList(opts(token))).data,
    get: async (token: string | null, id: string) =>
      (await clientsControllerGet(id, opts(token))).data,
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
};

export type { ClientResponse, ItemResponse, EntitlementsResponse, ReminderResponse }
  from "./generated/ruledOffAPI.schemas";
