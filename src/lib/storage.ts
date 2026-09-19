import { put, del } from "@vercel/blob";

// Object-storage seam. Replace the two function bodies to move off Vercel Blob
// (S3, Azure Blob, on-prem share) without touching any caller.

export async function uploadImage(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  // Vercel appends a number when the default store name was already taken.
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB1_READ_WRITE_TOKEN;
  const { url } = await put(key, data, {
    access: "public",
    contentType,
    token,
  });
  return url;
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
