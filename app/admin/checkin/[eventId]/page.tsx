'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkInWithMasterToken } from './actions';
import { Html5Qrcode } from 'html5-qrcode';

export default function StationCheckIn() {
  const params = useParams<{ eventId: string }>();
  const eventId = parseInt(params.eventId);

  const [masterToken, setMasterToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const handleCheckIn = async (token?: string) => {
    const tokenToUse = token || masterToken;
    if (!tokenToUse.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await checkInWithMasterToken(eventId, tokenToUse.trim());
      setResult(res);

      if (res.success) {
        setMessage(`✅ Checked in: ${res.participantName}`);
        // Optionally stop scanner after successful check-in
        if (isScanning) {
          await stopScanner();
        }
      } else {
        setMessage(res.message || 'Could not check in.');
      }
    } catch (e) {
      setMessage('Error during check-in.');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setMessage('');
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successful scan
          setMasterToken(decodedText);
          handleCheckIn(decodedText);
        },
        (errorMessage) => {
          // Ignore frequent "no QR found" errors
        }
      );
    } catch (err) {
      console.error(err);
      setMessage('Could not start camera. Please check permissions or use manual entry.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
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
