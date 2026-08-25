import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Local document storage (dev). Files live outside the web root and are only
 * ever served through the access-controlled /api/documents/[id] route — never a
 * public URL (Phase 30 document access control). In production, swap these
 * helpers for object storage (S3/GCS) keyed the same way.
 */
const BASE = path.join(process.cwd(), "storage", "documents");

export const ALLOWED_DOC_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

export async function saveDocument(bytes: Buffer, ext: string): Promise<string> {
  await fs.mkdir(BASE, { recursive: true });
  const key = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(BASE, key), bytes);
  return key;
}

export async function readDocument(key: string): Promise<Buffer> {
  // basename guards against path traversal.
  return fs.readFile(path.join(BASE, path.basename(key)));
}

export async function deleteDocumentFile(key: string): Promise<void> {
  await fs.rm(path.join(BASE, path.basename(key)), { force: true });
}

export function contentTypeForKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return (
    Object.entries(ALLOWED_DOC_MIME).find(([, e]) => e === ext)?.[0] ??
    "application/octet-stream"
  );
}
