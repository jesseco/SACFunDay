'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkInWithMasterToken } from './actions';

export default function StationCheckIn() {
  const params = useParams<{ eventId: string }>();
  const eventId = parseInt(params.eventId);

  const [masterToken, setMasterToken] = useState('');
  const [result, setResult] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any -- loose result typing is pre-existing and fine for this UI state bag
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Use refs to avoid stale closures (esp. important for scanner decode callback
  // and to prevent effect re-runs that would restart the camera unnecessarily).
  const isScanningRef = useRef(false);
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  const masterTokenRef = useRef('');
  useEffect(() => {
    masterTokenRef.current = masterToken;
  }, [masterToken]);

  const scannerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any -- avoid static `import type {Html5Qrcode}` which would pull the heavy package into the page module graph even for type-only; we only dynamic import at runtime.
  const scannerContainerId = 'qr-reader';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  }, []);

  const handleCheckIn = useCallback(async (token?: string) => {
    const tokenToUse = token || masterTokenRef.current;
    if (!tokenToUse.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await checkInWithMasterToken(eventId, tokenToUse.trim());
      setResult(res);

      if (res.success) {
        setMessage(`✅ Checked in: ${res.participantName}`);
        // Stop scanner after successful check-in (use ref to avoid stale state)
        if (isScanningRef.current) {
          await stopScanner();
        }
      } else {
        setMessage(res.message || 'Could not check in.');
      }
    } catch {
      setMessage('Error during check-in.');
    } finally {
      setLoading(false);
    }
  }, [eventId, stopScanner]);

  // Lazy / dynamic load of the heavy html5-qrcode lib (includes large zxing decoder).
  // Only imported when user explicitly clicks "Start Camera Scanner".
  // This keeps the initial page chunk small, reduces Turbopack dev-server memory
  // (no need to parse 300+ files / 1MB+ third_party zxing for the checkin route
  // until actually needed), and fixes the previous DOM race on init.
  const startScanner = () => {
    setMessage('');
    setIsScanning(true); // The effect below will perform the actual dynamic import + start
  };

  // Initialize scanner (dynamic import + start) when isScanning becomes true.
  // Effect runs after render so the #qr-reader div is guaranteed to exist in DOM.
  useEffect(() => {
    if (!isScanning) return;

    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !isScanning) return;

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setMasterToken(decodedText);
            handleCheckIn(decodedText);
          },
          () => {
            // Ignore frequent "no QR found" errors
          }
        );
      } catch {
        setMessage('Could not start camera. Please check permissions or use manual entry.');
        setIsScanning(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isScanning, handleCheckIn]);

  // Cleanup on unmount (in case component unmounts while scanning)
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Station Check-in</h1>
      <p className="text-zinc-600 mb-6">
        Scan a participant’s Master QR code or enter the token manually.
      </p>

      {/* Camera Scanner Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Camera Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          {!isScanning ? (
            <Button onClick={startScanner} className="w-full h-12 text-lg">
              Start Camera Scanner
            </Button>
          ) : (
            <div className="space-y-4">
              <div id={scannerContainerId} className="w-full rounded-lg overflow-hidden border" />
              <Button onClick={stopScanner} variant="outline" className="w-full">
                Stop Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Fallback */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry (Fallback)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Paste or type master check-in token"
            value={masterToken}
            onChange={(e) => setMasterToken(e.target.value)}
            className="font-mono"
          />

          <Button 
            onClick={() => handleCheckIn()} 
            disabled={loading || !masterToken.trim()}
            className="w-full h-12 text-lg"
          >
            {loading ? 'Checking in...' : 'Check In for This Event'}
          </Button>

          {message && (
            <div className={`p-4 rounded-lg text-center font-medium ${message.startsWith('✅') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {result?.participantName && (
            <div className="mt-4 p-4 bg-zinc-100 rounded-lg">
              <div className="font-semibold text-lg">{result.participantName}</div>
              <div className="text-sm text-zinc-600 mt-1">
                All registered events:
              </div>
              <ul className="mt-2 text-sm list-disc list-inside">
                {result.allEvents?.map((ev: string, i: number) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-500 mt-6 text-center">
        Tip: The camera scanner works best in good lighting. Use manual entry if the camera fails.
      </p>
    </div>
  );
}
