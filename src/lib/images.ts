import { supabase } from "@/integrations/supabase/client";

/** Resize an image file in the browser to a JPEG data URL (keeps uploads and AI requests small). */
export async function resizeImage(file: File, maxSize = 1280, quality = 0.85): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("ERR_BAD_IMAGE");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("ERR_BAD_IMAGE"));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ERR_BAD_IMAGE");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64 = ""] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header ?? "")?.[1] ?? "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Upload a product photo to the artisan's private folder and return a long-lived link for the catalogue. */
export async function uploadProductImage(userId: string, dataUrl: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, dataUrlToBlob(dataUrl), { contentType: "image/jpeg", upsert: false });
  if (error) { console.error(error); throw new Error("ERR_UPLOAD"); };
  const { data, error: signError } = await supabase.storage.from("product-images").createSignedUrl(path, TEN_YEARS);
  if (signError || !data) throw new Error("ERR_UPLOAD");
  return data.signedUrl;
}
