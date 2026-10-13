import { fitWithin, MAX_PHOTO_SIDE_PX, PHOTO_JPEG_QUALITY } from "@/lib/receipt";

/**
 * Reduz a foto da nota no aparelho (lado maior até 1600 px, JPEG) antes do envio.
 * Se o navegador não conseguir decodificar o arquivo, devolve o original; o limite de 10 MB continua valendo.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_PHOTO_SIDE_PX);
    const resized = width !== bitmap.width || height !== bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY));
    // Foto já pequena que não encolheu: manda a original.
    if (!blob || (!resized && blob.size >= file.size)) return file;
    return new File([blob], "nota-fiscal.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
