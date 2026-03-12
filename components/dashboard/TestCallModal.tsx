'use client';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, PhoneOff } from 'lucide-react';

interface TestCallModalProps {
  open: boolean;
  onClose: () => void;
  assistantId: string;
}

export function TestCallModal({ open, onClose, assistantId }: TestCallModalProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [duration, setDuration] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setDuration(0);
      return;
    }

    let vapi: typeof vapiRef.current;

    async function initVapi() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
        vapiRef.current = vapi;

        vapi.on('call-start', () => {
          setStatus('active');
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        });
        vapi.on('call-end', () => {
          setStatus('ended');
          clearInterval(timerRef.current);
        });
        vapi.on('error', () => {
          setStatus('ended');
          clearInterval(timerRef.current);
        });

        setStatus('connecting');
        await vapi.start(assistantId);
      } catch {
        setStatus('ended');
      }
    }

    initVapi();

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, [open, assistantId]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleEnd = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-sm text-center max-w-sm">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Test Your AI</DialogTitle>
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
        </div>
        {status !== 'ended' ? (
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
