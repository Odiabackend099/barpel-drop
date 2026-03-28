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
  start: (assistantId: string) => Promise<void>;
  stop: () => void;
};

interface TestCallModalProps {
  open: boolean;
  onClose: () => void;
  assistantId: string;
}

export function TestCallModal({ open, onClose, assistantId }: TestCallModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [duration, setDuration] = useState(0);
  const vapiRef = useRef<VapiInstance | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setDuration(0);
      return;
    }

    let mounted = true;

    async function initVapi() {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        if (!publicKey) {
          if (mounted) setStatus('error');
          return;
        }

        const { default: Vapi } = await import('@vapi-ai/web');
        const vapi = new Vapi(publicKey) as unknown as VapiInstance;
        vapiRef.current = vapi;

        vapi.on('call-start', () => {
          if (!mounted) return;
          setStatus('active');
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        });
        vapi.on('call-end', () => {
          if (!mounted) return;
          setStatus('ended');
          clearInterval(timerRef.current);
        });
        vapi.on('error', () => {
          if (!mounted) return;
          setStatus('error');
          clearInterval(timerRef.current);
        });

        if (mounted) setStatus('connecting');
        await vapi.start(assistantId);
      } catch {
        if (mounted) setStatus('error');
      }
    }

    initVapi();

    return () => {
      mounted = false;
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
      clearInterval(timerRef.current);
    };
  }, [open, assistantId]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleEnd = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
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
