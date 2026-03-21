'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check } from 'lucide-react';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function OutboundCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isValid = E164_REGEX.test(phoneNumber);

  const handleDial = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/test-call/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to place call');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="backdrop-blur-sm max-w-sm">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Call a Number</DialogTitle>
          <DialogDescription>Place a real call from your AI assistant.</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <Check className="w-6 h-6 text-brand-600" />
            </div>
            <p className="text-sm text-[#1B2A4A] font-medium">
              Call initiated. Your phone will ring within 10 seconds.
            </p>
            <Button className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  This will use approximately 2 minutes of credits and make a real phone call.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number (E.164 format)</Label>
                <Input
                  id="phone"
                  placeholder="+447700900000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Must start with + and country code</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!isValid || loading} onClick={handleDial}>
                {loading ? 'Dialing...' : 'Dial'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
