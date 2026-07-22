import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { env } from "../config/env";
import { unauthorized, serviceUnavailable } from "../lib/errors";
import { runReminders } from "../services/scheduler";

/** The daily reminder scheduler. Mounted at /cron. Protect with CRON_SECRET
 *  (Bearer header or ?key=). Point a scheduler (Vercel Cron, GitHub Actions,
 *  a container cron) at POST /cron/reminders once a day. */
export const remindersRouter = Router();

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const auth = req.header("authorization");
  if (auth === `Bearer ${env.CRON_SECRET}`) return true;
  return req.query.key === env.CRON_SECRET;
}

const runHandler = asyncHandler(async (req, res) => {
  if (!env.CRON_SECRET) throw serviceUnavailable("CRON_SECRET is not configured");
  if (!authorized(req)) throw unauthorized("Bad cron secret");
  const report = await runReminders();
  res.json(report);
});

remindersRouter.get("/reminders", runHandler);
remindersRouter.post("/reminders", runHandler);
