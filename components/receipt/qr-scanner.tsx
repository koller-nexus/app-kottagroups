"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { accessKeyFromQrUrl, fitWithin } from "@/lib/receipt";

const SCAN_INTERVAL_MS = 250;
// Quadro reduzido para o jsQR: o QR da nota continua legível e a leitura fica leve.
const DECODE_SIDE_PX = 640;
const INVALID_QR = "Esse QR não parece de nota fiscal.";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-surface";

type Decode = (video: HTMLVideoElement) => Promise<string | null>;

// BarcodeDetector ainda não está no lib.dom do TypeScript.
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorClass {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

/** Leitor nativo quando existe (Chrome/Android); jsQR sob demanda nos demais (Safari/iOS). */
async function createDecoder(canvas: HTMLCanvasElement): Promise<Decode> {
  const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
  if (Native && (await Native.getSupportedFormats()).includes("qr_code")) {
    const detector = new Native({ formats: ["qr_code"] });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  }
  const { default: jsQR } = await import("jsqr");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!context || !video.videoWidth) return null;
    const { width, height } = fitWithin(video.videoWidth, video.videoHeight, DECODE_SIDE_PX);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    return jsQR(context.getImageData(0, 0, width, height).data, width, height)?.data ?? null;
  };
}

export default function QrScanner({
  onDetected,
  onUnavailable,
  onClose,
}: {
  onDetected: (qrUrl: string) => void;
  onUnavailable: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  const detected = useEffectEvent(onDetected);
  const unavailable = useEffectEvent(onUnavailable);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    dialogRef.current?.showModal();
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;
    let lastText = "";

    // Desligar as trilhas é o que apaga a luz da câmera.
    function stop() {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    }

    async function scan(video: HTMLVideoElement, decode: Decode) {
      if (stopped) return;
      const text = await decode(video).catch(() => null);
      if (stopped) return;
      if (text && text !== lastText) {
        lastText = text;
        if (accessKeyFromQrUrl(text)) {
          stop();
          detected(text);
          return;
        }
        setHint(INVALID_QR);
      }
      timer = window.setTimeout(() => scan(video, decode), SCAN_INTERVAL_MS);
    }

    async function start() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !navigator.mediaDevices?.getUserMedia) return unavailable();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) return stop();
        video.srcObject = stream;
        await video.play();
        await scan(video, await createDecoder(canvas));
      } catch {
        // Permissão negada, sem câmera ou leitor indisponível: segue por chave ou foto.
        if (!stopped) {
          stop();
          unavailable();
        }
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      stop();
      close();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    void start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="leitor-qr-titulo"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-kotta-secondary p-0 text-kotta-surface backdrop:bg-kotta-secondary/80 sm:m-auto sm:h-auto sm:max-w-lg sm:rounded-card"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <h2 id="leitor-qr-titulo" className="text-base font-semibold">
            Escanear QR code da nota
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold ${focus}`}
          >
            Fechar
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden sm:aspect-square sm:flex-none">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-56 rounded-card border-2 border-kotta-surface/80"
          />
        </div>
        <canvas ref={canvasRef} hidden />
        <p role="status" className="px-4 py-4 text-center text-sm">
          {hint ?? "Aponte para o QR code no rodapé da nota."}
        </p>
      </div>
    </dialog>
  );
}
