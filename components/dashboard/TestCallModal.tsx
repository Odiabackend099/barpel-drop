'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, PhoneOff } from 'lucide-react';

type Status = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

type VapiInstance = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off: (event: string, cb: (...args: unknown[]) => void) => void;
  start: (assistantId: string) => Promise<void>;
  stop: () => void;
};

interface TestCallModalProps {
  open: boolean;
  onClose: () => void;
  assistantId: string;
}

// Module-level singleton — Vapi and KrispSDK initialize ONCE per page load.
// Re-creating Vapi on every call duplicates KrispSDK which degrades after the
// 2nd or 3rd call in the same session, causing the AI to stop receiving audio.
let _vapiSingleton: VapiInstance | null = null;
let _vapiSingletonKey: string | null = null;

async function getVapi(publicKey: string): Promise<VapiInstance> {
  if (_vapiSingleton && _vapiSingletonKey === publicKey) return _vapiSingleton;
  const { default: Vapi } = await import('@vapi-ai/web');
  _vapiSingleton = new Vapi(publicKey) as unknown as VapiInstance;
  _vapiSingletonKey = publicKey;
  return _vapiSingleton;
}

export function TestCallModal({ open, onClose, assistantId }: TestCallModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [duration, setDuration] = useState(0);
  const vapiRef = useRef<VapiInstance | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setDuration(0);
      return;
    }

    let mounted = true;

    const onCallStart = () => {
      if (!mounted) return;
      setStatus('active');
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    };
    const onCallEnd = () => {
      if (!mounted) return;
      setStatus('ended');
      clearInterval(timerRef.current);
    };
    const onError = () => {
      if (!mounted) return;
      setStatus('error');
      clearInterval(timerRef.current);
    };

    async function initVapi() {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        if (!publicKey) {
          if (mounted) setStatus('error');
          return;
        }

        // Acquire a fresh microphone track before every call. This guarantees
        // Daily.co receives a live track regardless of prior call history.
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          micStream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = micStream;
        const audioTrack = micStream.getAudioTracks()[0];

        // Reuse singleton — KrispSDK is already initialized from the first call.
        const vapi = await getVapi(publicKey);
        // Inject the fresh track into Vapi's Daily config before this call starts.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vapi as any).dailyCallObject = { audioSource: audioTrack };
        vapiRef.current = vapi;

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('error', onError);

        if (mounted) setStatus('connecting');
        await vapi.start(assistantId);
      } catch {
        if (mounted) setStatus('error');
      }
    }

    initVapi();

    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      if (vapiRef.current) {
        vapiRef.current.off('call-start', onCallStart);
        vapiRef.current.off('call-end', onCallEnd);
        vapiRef.current.off('error', onError);
        vapiRef.current.stop();
        vapiRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
  }, [open, assistantId]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleEnd = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-sm text-center max-w-sm">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Test Your AI</DialogTitle>
          <DialogDescription className="sr-only">
            Test your AI voice assistant directly in the browser.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              status === 'active' ? 'bg-teal-100 animate-pulse' : 'bg-muted'
            }`}
          >
            <Mic
              className={`w-8 h-8 ${status === 'active' ? 'text-teal-600' : 'text-muted-foreground'}`}
            />
          </div>
          {status === 'connecting' && (
            <p className="text-sm text-muted-foreground">Connecting...</p>
          )}
          {status === 'active' && (
            <p className="text-sm font-mono text-teal-600">{formatDuration(duration)}</p>
          )}
          {status === 'ended' && (
            <p className="text-sm text-muted-foreground">
              Test call complete. Check your Call Logs to see the transcript.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-500">
              Connection failed. Please close and try again.
            </p>
          )}
        </div>
        {status !== 'ended' && status !== 'error' ? (
          <Button variant="destructive" onClick={handleEnd} className="w-full">
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        ) : (
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
