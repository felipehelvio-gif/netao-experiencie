'use client';

import * as React from 'react';
import { Camera, RefreshCw, X, Check, Loader2, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCapture: (blob: Blob) => Promise<void> | void;
  /** Texto exibido no header — ex: "Foto check-in · Felipe Helvio · #001" */
  headline?: string;
};

export function CameraCapture({ open, onOpenChange, onCapture, headline }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [erro, setErro] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<string | null>(null);
  const [snapshotBlob, setSnapshotBlob] = React.useState<Blob | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');

  const stop = React.useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const start = React.useCallback(async () => {
    setErro(null);
    setSnapshot(null);
    setSnapshotBlob(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? `Câmera indisponível: ${e.message}. Permita o acesso e tenta de novo.`
          : 'Não consegui abrir a câmera.',
      );
    }
  }, [facingMode, stop]);

  React.useEffect(() => {
    if (!open) {
      stop();
      setSnapshot(null);
      setSnapshotBlob(null);
      return;
    }
    start();
    return stop;
  }, [open, start, stop]);

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 960;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSnapshotBlob(blob);
        setSnapshot(URL.createObjectURL(blob));
        // pausa o stream pra não consumir CPU
        stop();
      },
      'image/jpeg',
      0.85,
    );
  };

  const refazer = () => {
    if (snapshot) URL.revokeObjectURL(snapshot);
    setSnapshot(null);
    setSnapshotBlob(null);
    start();
  };

  const trocarCamera = () => {
    setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  const confirmar = async () => {
    if (!snapshotBlob) return;
    setEnviando(true);
    try {
      await onCapture(snapshotBlob);
      // o pai fecha o modal
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-santafe-navy text-santafe-cream" hideClose={enviando}>
        <DialogHeader>
          <DialogTitle className="text-santafe-orange">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de check-in
            </span>
          </DialogTitle>
          {headline && (
            <DialogDescription className="text-santafe-cream/80">
              {headline}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border-2 border-santafe-orange bg-black">
          <div className="relative aspect-[4/3] w-full">
            {erro ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-santafe-cream">
                {erro}
              </div>
            ) : snapshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={snapshot}
                alt="Foto capturada"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {!snapshot ? (
          <div className="flex items-center gap-2">
            <Button
              variant="navy"
              size="default"
              onClick={trocarCamera}
              type="button"
              className="border-2 border-santafe-orange/40"
              disabled={!!erro}
            >
              <SwitchCamera className="h-4 w-4" />
              {facingMode === 'environment' ? 'Frontal' : 'Traseira'}
            </Button>
            <Button
              onClick={tirarFoto}
              size="lg"
              type="button"
              className="flex-1 text-lg"
              disabled={!!erro}
            >
              <Camera className="h-5 w-5" />
              Capturar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="navy"
              size="default"
              onClick={refazer}
              type="button"
              className="border-2 border-santafe-orange/40"
              disabled={enviando}
            >
              <RefreshCw className="h-4 w-4" />
              Refazer
            </Button>
            <Button
              onClick={confirmar}
              variant="success"
              size="lg"
              type="button"
              className="flex-1 text-lg"
              disabled={enviando}
            >
              {enviando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirmar entrada
                </>
              )}
            </Button>
          </div>
        )}

        {!enviando && !snapshot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            type="button"
            className="text-santafe-cream/70"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
