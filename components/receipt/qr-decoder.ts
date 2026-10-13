import { fitWithin, MAX_PHOTO_SIDE_PX, QR_SEARCH_DEADLINE_MS } from "@/lib/receipt";

/** Lê o QR do que estiver desenhado no canvas; `null` quando não acha. */
export type QrDecoder = (canvas: HTMLCanvasElement) => Promise<string | null>;

// BarcodeDetector ainda não está no lib.dom do TypeScript.
interface BarcodeDetectorLike {
  detect(source: HTMLCanvasElement): Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorClass {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

// Escalas sobre a resolução original: o QR da NFC-e é pequeno e some quando a foto é reduzida.
const QR_SEARCH_SCALES = [1, 0.75, 0.5];
// A foto da nota costuma vir deitada.
const QR_SEARCH_ROTATIONS = [90, 180, 270];
// Teto do canvas para fotos enormes (limite de memória de canvas no iOS).
const MAX_DECODE_SIDE_PX = 4096;
// O QR fica no rodapé do cupom.
const FOOTER_SHARE = 1 / 3;

interface SearchAttempt {
  maxSide: number;
  rotation: number;
  footerOnly: boolean;
}

let decoderPromise: Promise<QrDecoder> | null = null;

/** Leitor nativo quando existe (Chrome/Android); jsQR sob demanda nos demais (Safari/iOS). */
export function createQrDecoder(): Promise<QrDecoder> {
  decoderPromise ??= loadDecoder().catch((error: unknown) => {
    decoderPromise = null;
    throw error;
  });
  return decoderPromise;
}

async function loadDecoder(): Promise<QrDecoder> {
  const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
  if (Native && (await Native.getSupportedFormats()).includes("qr_code")) {
    const detector = new Native({ formats: ["qr_code"] });
    return async (canvas) => (await detector.detect(canvas).catch(() => []))[0]?.rawValue ?? null;
  }
  const { default: jsQR } = await import("jsqr");
  return async (canvas) => {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas.width || !canvas.height) return null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return jsQR(pixels, canvas.width, canvas.height)?.data ?? null;
  };
}

/** Do mais barato ao mais caro; o rodapé vem antes das rotações, que raramente mudam o resultado. */
function searchAttempts(width: number, height: number): SearchAttempt[] {
  const longest = Math.max(width, height);
  const atScale = (scale: number) => Math.min(longest * scale, MAX_DECODE_SIDE_PX);
  return [
    { maxSide: MAX_PHOTO_SIDE_PX, rotation: 0, footerOnly: false },
    ...QR_SEARCH_SCALES.map((scale) => ({ maxSide: atScale(scale), rotation: 0, footerOnly: false })),
    { maxSide: MAX_DECODE_SIDE_PX, rotation: 0, footerOnly: true },
    ...QR_SEARCH_ROTATIONS.flatMap((rotation) =>
      QR_SEARCH_SCALES.map((scale) => ({ maxSide: atScale(scale), rotation, footerOnly: false })),
    ),
  ];
}

function drawAttempt(canvas: HTMLCanvasElement, bitmap: ImageBitmap, attempt: SearchAttempt) {
  const sourceY = attempt.footerOnly ? Math.floor(bitmap.height * (1 - FOOTER_SHARE)) : 0;
  const sourceHeight = bitmap.height - sourceY;
  const { width, height } = fitWithin(bitmap.width, sourceHeight, attempt.maxSide);
  const sideways = attempt.rotation % 180 !== 0;
  // Redimensionar o canvas também zera a transformação anterior.
  canvas.width = sideways ? height : width;
  canvas.height = sideways ? width : height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((attempt.rotation * Math.PI) / 180);
  context.drawImage(bitmap, 0, sourceY, bitmap.width, sourceHeight, -width / 2, -height / 2, width, height);
}

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve));

/**
 * Procura o QR da nota numa foto ou print, no aparelho.
 * `null` quando não acha, quando a imagem não abre ou quando passa de QR_SEARCH_DEADLINE_MS:
 * em todos esses casos a imagem segue pro OCR.
 */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const startedAt = performance.now();
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const decode = await createQrDecoder();
    const canvas = document.createElement("canvas");
    for (const attempt of searchAttempts(bitmap.width, bitmap.height)) {
      if (performance.now() - startedAt > QR_SEARCH_DEADLINE_MS) return null;
      drawAttempt(canvas, bitmap, attempt);
      const text = await decode(canvas);
      if (text) return text;
      await yieldToBrowser();
    }
    return null;
  } catch {
    // Leitor indisponível (jsQR não baixou, por exemplo): o OCR resolve.
    return null;
  } finally {
    bitmap.close();
  }
}
