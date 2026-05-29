'use client';

import { useState } from 'react';
import Link from 'next/link';
import { retrieveRegistrations } from './actions';

type RetrievedRegistration = {
  participantName: string;
  events: string[];
  qrDataUrl: string; // base64 data URL for now
};

export default function RetrieveQR() {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [isForSelf, setIsForSelf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RetrievedRegistration[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const data = await retrieveRegistrations({
        phone: phone.trim() || undefined,
        fullName: fullName.trim(),
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        isForSelf,
      });

      if (data.length === 0) {
        setError('No matching registration found. Please double-check the details or ask an OC member for help.');
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Something went wrong. Please try again or ask an OC member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-md px-6 py-12">
        <Link href="/portal" className="text-sm text-emerald-700 hover:underline">
          ← Back to portal
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight mt-6 mb-2">
          Retrieve Your QR Code
        </h1>
        <p className="text-zinc-600 mb-8">
          Forgot or lost your QR code? Enter a few details below to retrieve your <strong>Master QR code</strong>.
        </p>

        {results.length === 0 ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm">
            <div>
              <label className="block text-sm font-medium mb-1">Phone number used during registration (recommended)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+65 9123 4567"
                className="w-full border rounded-lg px-4 h-11"
              />
              <p className="text-xs text-zinc-500 mt-1">This is the strongest way to find your registration.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Full name of the person *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ethan Tan"
                className="w-full border rounded-lg px-4 h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year of birth (optional but helpful)</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="2015"
                className="w-full border rounded-lg px-4 h-11"
                min="1900"
                max="2026"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isForSelf"
                checked={isForSelf}
                onChange={(e) => setIsForSelf(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="isForSelf" className="text-sm">
                I am looking for my own registration (adult)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !fullName}
              className="w-full h-12 rounded-full bg-emerald-600 text-white font-medium disabled:opacity-60"
            >
              {loading ? 'Searching...' : 'Find My QR Code'}
            </button>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Found your registration(s)</h2>

            {results.map((reg, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm text-center">
                <p className="font-medium text-lg mb-4">{reg.participantName}</p>
                
                <img 
                  src={reg.qrDataUrl} 
                  alt={`QR Code for ${reg.participantName}`} 
                  className="mx-auto w-48 h-48 mb-4" 
                />
                
                <p className="text-sm text-zinc-600 mb-4">
                  Events: {reg.events.join(', ')}
                </p>

                <a 
                  href={reg.qrDataUrl} 
                  download={`QR_${reg.participantName.replace(/\s+/g, '_')}.png`}
                  className="inline-block text-sm text-emerald-700 underline"
                >
                  Download QR Code
                </a>
              </div>
            ))}

            <button
              onClick={() => {
                setResults([]);
                setError('');
              }}
              className="w-full h-11 rounded-full border text-sm"
            >
              Search again
            </button>
          </div>
        )}

        <div className="mt-8 text-xs text-center text-zinc-500">
          Still can't find it? Please go to The Stand and ask an OC member. They can look it up for you quickly.
        </div>
      </div>
    </div>
  );
}
