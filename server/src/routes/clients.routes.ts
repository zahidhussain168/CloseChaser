import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { validate, uuid } from "../middleware/validate";
import { badRequest, notFound } from "../lib/errors";

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

const clientBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email(),
  phone: z.string().trim().optional().nullable(),
});

/** List the firm's clients. */
clientsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db.from("clients").select("*").order("created_at", { ascending: true });
    if (error) throw badRequest(error.message);
    res.json({ clients: data });
  }),
);

/** Create a client under the caller's firm. */
clientsRouter.post(
  "/",
  validate({ body: clientBody }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const body = req.body as z.infer<typeof clientBody>;
    const { data, error } = await auth.db
      .from("clients")
      .insert({ firm_id: auth.firmId, name: body.name, email: body.email, phone: body.phone ?? null })
      .select("*")
      .single();
    if (error) throw badRequest(error.message);
    res.status(201).json({ client: data });
  }),
);

/** Read one client. */
clientsRouter.get(
  "/:id",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data } = await auth.db.from("clients").select("*").eq("id", req.params.id).maybeSingle();
    if (!data) throw notFound("Client not found");
    res.json({ client: data });
  }),
);

/** Update a client. */
clientsRouter.patch(
  "/:id",
  validate({ params: z.object({ id: uuid }), body: clientBody.partial() }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data, error } = await auth.db
      .from("clients")
      .update(req.body)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();
    if (error) throw badRequest(error.message);
    if (!data) throw notFound("Client not found");
    res.json({ client: data });
  }),
);

/** Delete a client. */
clientsRouter.delete(
  "/:id",
  validate({ params: z.object({ id: uuid }) }),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { error } = await auth.db.from("clients").delete().eq("id", req.params.id);
    if (error) throw badRequest(error.message);
    res.status(204).end();
  }),
);
