# Frontend -> standalone API migration

The Next.js app currently talks to Supabase directly through server actions and
server components. This is the plan (and the foundation that's already in place)
for moving those calls onto the standalone Express API in `server/`.

## Safety switch

Everything is gated by one env var:

- `NEXT_PUBLIC_API_URL` **unset** (current production): the app uses its built-in
  server actions and DB reads. Nothing changes.
- `NEXT_PUBLIC_API_URL=https://api.ruledoff...`: call sites that have been
  migrated route through the Express API instead.

So the migration can land incrementally with zero production risk, and be turned
on only once the API is deployed.

## What's already in place (`src/lib/api/`)

- `config.ts` — `API_BASE_URL`, `isApiEnabled()`.
- `http.ts` — `apiFetch<T>()` with a typed `ApiError`, Bearer auth, JSON + form.
- `server.ts` — `getServerToken()` (server components / actions, cookie session).
- `browser.ts` — `getBrowserToken()` (client components).
- `resources.ts` — typed calls: `clientsApi`, `closeApi`, `itemsApi`, `qboApi`.

## Migrated so far (all behind `isApiEnabled()`)

| Server action | API call |
| --- | --- |
| `createClientAction` | `clientsApi.create` |
| `addItemAction` | `closeApi.addItem` |
| `deleteItemAction` | `itemsApi.remove` |
| `acceptItemAction` | `itemsApi.accept` (accept + QBO write-back + period close) |
| `sendBackItemAction` | `itemsApi.reopen` |
| `fireChaseAction` | `closeApi.chase` |
| `ensureLinkAction` | `closeApi.link` |
| `regenerateLinkAction` | `closeApi.regenerateLink` |
| `importFromQboAction` | `qboApi.import` |
| `getClientDetail` (read) | `closeApi.checklist` |
| `getDashboard` (read) | `dashboardApi.get` (`GET /api/dashboard`) |
| `updateBrandingAction` | `firmApi.updateBranding` |
| `updateCadenceAction` | `firmApi.updateCadence` |
| `updateTemplateAction` (email copy) | `firmApi.updateEmailTemplate` |
| `createTemplateAction` | `templatesApi.create` |
| `addStarterTemplateAction` | `templatesApi.addStarter` |
| `addTemplateItemAction` | `templatesApi.addItem` |
| `deleteTemplateItemAction` | `templatesApi.removeItem` |
| `deleteTemplateAction` | `templatesApi.remove` |
| `applyTemplateAction` | `templatesApi.apply` |
| `setClientDefaultTemplateAction` | `templatesApi.setDefault` |
| `listTemplates` (read) | `templatesApi.list` |
| `generateChaseEmailsAction` | `aiApi.generate` |
| `saveChaseEmailsAction` | `aiApi.save` |
| `prepareCheckoutAction` | `billingApi.checkout` |
| `openBillingPortalAction` | `billingApi.portal` |
| `getFirm` (read, used everywhere) | `firmApi.get` (`GET /api/firm`) |

Each keeps its original DB path as the fallback when the switch is off, so
current production is byte-for-byte unchanged. The dashboard page now calls the
combined `getDashboard()` (clients + rollup in one payload/endpoint).

## Prerequisites to flip it on

1. **Deploy the API** (`server/`) to a host (Render, Railway, Fly, a container,
   or Vercel functions). It needs the same env as the app (Supabase keys, etc.).
2. Set the API's `CORS_ORIGINS` to include the app's origin.
3. Set `NEXT_PUBLIC_API_URL` in the app's Vercel project and redeploy.
4. Point the QBO redirect URI and Paddle webhook at the API host.

## Suggested order (each is one PR, behind the switch)

1. ~~Writes: create client, add item, accept, reopen, chase, link, QBO import.~~ **Done.**
2. ~~Reads: client checklist + the combined dashboard (`GET /api/dashboard`).~~ **Done.**
3. ~~Settings: branding, cadence, request templates, email copy, AI.~~ **Done.**
4. ~~Billing (Paddle): checkout + customer portal.~~ **Done.** (`billingApi.status`
   endpoint also exists; the plan page still derives status from `getFirm`, so
   wiring that read is part of the final `getFirm` pass.)
5. ~~Final read pass: `getFirm`.~~ **Done.** Because the firm row carries the
   billing fields, the plan page's `getSubscriptionState(firm)` now reads through
   the API too. (`getQboConnection` is left on the DB: it is only used by the
   Next-side write-back, which is itself bypassed when the switch is on since
   `acceptItemAction` calls the API's accept, and by a couple of display flags
   that read the shared `qbo_connections` row directly, which is harmless.)
6. Move the daily cron to hit the API's `/api/cron/reminders`; retire the
   Next.js cron route.
7. When every call site is verified live, delete the corresponding server
   actions and `lib/data.ts` DB helpers.

## Status

**Every user-facing read and write is now switch-ready.** With `NEXT_PUBLIC_API_URL`
set (and the API deployed), the app's data flows entirely through the Express
service; without it, the app is byte-for-byte its current self. What remains is
operational, not code: deploy the API, flip the switch in a preview, smoke-test,
then move the cron and delete the dead DB paths.

## Notes

- The API enforces the same RLS by forwarding the user's access token, so
  authorization behaviour is identical to the cookie-session app.
- Response envelopes are `{ clients }`, `{ client }`, `{ item }`, etc.; the
  resource helpers already unwrap them.
