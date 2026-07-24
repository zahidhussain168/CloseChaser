import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * Supabase Storage, private bucket.
 *
 * File bytes never pass through this API. We authorize the caller, mint a
 * short-lived SIGNED UPLOAD URL, and the browser PUTs straight to Supabase.
 * That keeps us under the serverless request size limit and off the critical
 * path for large receipts. Downloads are the mirror image: a signed URL that
 * expires in a minute.
 *
 * The service role key lives only here, server-side. It is never returned to a
 * caller and never sent to the browser.
 */
const BUCKET = "attachments";
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg", "image/png", "image/heic", "image/webp",
  "application/pdf",
  "text/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/** The one place the upload path layout is defined. */
export function uploadPrefix(clientId: string, itemId: string): string {
  return `${clientId}/${itemId}/`;
}

@Injectable()
export class StorageService {
  private client: SupabaseClient | undefined;

  private admin(): SupabaseClient {
    if (!this.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new InternalServerErrorException("Storage is not configured");
      this.client = createClient(url, key, { auth: { persistSession: false } });
    }
    return this.client;
  }

  /** Reject anything we would not want a client uploading, before signing. */
  private validate(mime: string, size: number): void {
    if (size > MAX_BYTES) throw new BadRequestException("File is larger than 25MB");
    if (!ALLOWED.includes(mime)) throw new BadRequestException(`Unsupported file type: ${mime}`);
  }

  /**
   * Path is derived server-side from the client and item, never from caller
   * input, so a caller cannot write outside their own item's folder. The
   * clientId/itemId layout matches what the existing app already writes, so
   * both apps read the same bucket the same way.
   */
  async signUpload(clientId: string, itemId: string, filename: string, mime: string, size: number) {
    this.validate(mime, size);
    const safe = filename.replace(/[^\w.\-]+/g, "_").slice(-100);
    const path = `${uploadPrefix(clientId, itemId)}${randomUUID()}-${safe}`;

    const { data, error } = await this.admin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      throw new InternalServerErrorException(error?.message ?? "Could not sign upload");
    }
    return { path: data.path, token: data.token, signedUrl: data.signedUrl, bucket: BUCKET };
  }

  /** Short-lived read URL for an already-stored object. */
  async signDownload(path: string, expiresInSeconds = 60): Promise<string> {
    const { data, error } = await this.admin()
      .storage.from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new InternalServerErrorException("Could not sign download");
    return data.signedUrl;
  }

  /** Confirm the object really exists before we record it against an item. */
  async objectExists(path: string): Promise<boolean> {
    const slash = path.lastIndexOf("/");
    const dir = slash === -1 ? "" : path.slice(0, slash);
    const name = slash === -1 ? path : path.slice(slash + 1);
    const { data } = await this.admin().storage.from(BUCKET).list(dir, { search: name, limit: 1 });
    return Boolean(data?.some((o) => o.name === name));
  }
}
