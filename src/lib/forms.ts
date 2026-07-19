/** Shared form-action state shape (kept out of "use server" modules). */
export type FormState = { ok: boolean; error?: string };
export const emptyFormState: FormState = { ok: false };
