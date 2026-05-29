'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveResult, markEventComplete } from './actions';

type Participant = {
  registrationId: number;
  participantId: number;
  name: string;
  bibNumber: string | null;
};

type ExistingResult = {
  performanceValue: string | null;
  place: number | null;
  status: string;
  source: string;
  enteredAt: Date | null;
  enteredBy: string | null;
};

interface ResultEntryFormProps {
  eventId: number;
  unit: string | null;
  participants: Participant[];
  existingResults: Map<number, ExistingResult>;
  isComplete: boolean;
  totalRegistered: number;
  defaultOperator?: string;
}

const PLACE_OPTIONS = [1, 2, 3, 4];
const STATUS_OPTIONS = [
  { value: 'ok', label: 'OK' },
  { value: 'dnf', label: 'DNF' },
  { value: 'dns', label: 'DNS' },
  { value: 'scratch', label: 'Scratch' },
];

export default function ResultEntryForm({
  eventId,
  unit,
  participants,
  existingResults,
  isComplete: initialComplete,
  totalRegistered,
  defaultOperator = '',
}: ResultEntryFormProps) {
  const [results, setResults] = useState<Record<number, Record<string, any>>>(() => {
    const initial: Record<number, any> = {};
    participants.forEach((p) => {
      const existing = existingResults.get(p.registrationId);
      initial[p.registrationId] = existing
        ? {
            performanceValue: existing.performanceValue || '',
            place: existing.place,
            status: existing.status,
            source: existing.source || 'app',
            enteredAt: existing.enteredAt || null,
            enteredBy: existing.enteredBy || null,
          }
        : {
            performanceValue: '',
            place: null,
            status: 'ok',
            source: 'paper-transcribed', // Default to paper when using this central entry screen
            enteredAt: null,
            enteredBy: null,
          };
    });
    return initial;
  });

  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [isComplete, setIsComplete] = useState(initialComplete);
  const [previousStates, setPreviousStates] = useState<Record<number, Record<string, any>>>({});

  // Global "Entered by" for this session (persisted in localStorage for convenience)
  const [enteredByName, setEnteredByName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resultEnteredBy');
      if (saved) return saved;
    }
    return defaultOperator || '';
  });

  // Live progress count based on local state
  const enteredCount = Object.values(results).filter((r: any) =>
    r.place !== null || r.status !== 'ok' || r.performanceValue
  ).length;

  const updateWithAudit = (regId: number, updates: Record<string, any>) => {
    const now = new Date();
    const enteredBy = enteredByName.trim() || 'OC';
    setResults((prev) => ({
      ...prev,
      [regId]: {
        ...prev[regId],
        ...updates,
        enteredAt: now,
        enteredBy,
      },
    }));
  };

  const updateResult = (regId: number, field: string, value: unknown) => {
    setResults((prev) => ({
      ...prev,
      [regId]: {
        ...prev[regId],
        [field]: value,
      },
    }));
  };

  // const setSource = (regId: number, source: string) => {
  //   updateResult(regId, 'source', source);
  // };

  const snapshotPrevious = (regId: number) => {
    setPreviousStates(prev => ({
      ...prev,
      [regId]: { ...results[regId] }
    }));
  };

  const handleUndo = async (regId: number) => {
    const previous = previousStates[regId];
    if (!previous) return;

    setResults(prev => ({
      ...prev,
      [regId]: { ...previous }
    }));

    setSaving(prev => ({ ...prev, [regId]: true }));

    try {
      await saveResult(eventId, regId, previous);
      // Clear the undo after successful revert
      setPreviousStates(prev => {
        const { [regId]: _, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      alert('Failed to undo change');
    } finally {
      setSaving(prev => ({ ...prev, [regId]: false }));
    }
  };

  const handleQuickPlace = async (regId: number, place: number) => {
    snapshotPrevious(regId); // Allow undo

    const current = results[regId];
    const newData = {
      ...current,
      place,
      status: 'ok',
    };

    updateWithAudit(regId, newData);
    setSaving((prev) => ({ ...prev, [regId]: true }));

    try {
      await saveResult(eventId, regId, newData);
    } catch (e) {
      alert('Failed to save result');
    } finally {
      setSaving((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const handleSourceToggle = async (regId: number, newSource: string) => {
    snapshotPrevious(regId); // Allow undo

    const current = results[regId];
    const newData = { ...current, source: newSource };

    updateWithAudit(regId, newData);
    setSaving((prev) => ({ ...prev, [regId]: true }));

    try {
      await saveResult(eventId, regId, newData);
    } catch (e) {
      alert('Failed to save');
    } finally {
      setSaving((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const handleSave = async (regId: number) => {
    const current = results[regId];
    const dataToSave = {
      ...current,
      enteredBy: enteredByName.trim() || current.enteredBy || 'OC',
    };

    setSaving((prev) => ({ ...prev, [regId]: true }));

    try {
      await saveResult(eventId, regId, dataToSave);
      // Update local state with the enteredBy we just used
      setResults(prev => ({
        ...prev,
        [regId]: dataToSave
      }));
    } catch (e) {
      alert('Failed to save result');
    } finally {
      setSaving((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const handleStatusChange = async (regId: number, status: string) => {
    snapshotPrevious(regId); // Allow undo

    const newData = {
      ...results[regId],
      status,
      place: status !== 'ok' ? null : results[regId].place,
    };

    updateWithAudit(regId, newData);
    setSaving((prev) => ({ ...prev, [regId]: true }));

    try {
      await saveResult(eventId, regId, newData);
    } catch (e) {
      alert('Failed to save');
    } finally {
      setSaving((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Mark this event as complete? You can still edit results later.')) return;

    try {
      await markEventComplete(eventId);
      setIsComplete(true);
    } catch (e) {
      alert('Failed to mark event as complete');
    }
  };

  const progressPercent = totalRegistered > 0 ? Math.round((enteredCount / totalRegistered) * 100) : 0;

  const handleEnteredByChange = (value: string) => {
    setEnteredByName(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resultEnteredBy', value);
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-zinc-50 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-sm font-medium text-zinc-700">
            Progress: <span className="font-semibold">{enteredCount} / {totalRegistered}</span> results entered
          </div>
          <div className="text-sm font-medium text-emerald-600">
            {progressPercent}%
          </div>
        </div>
        <div className="h-2.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Entered By - Global for this session (very useful on event day) */}
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm font-medium text-zinc-700 whitespace-nowrap">Entered by:</label>
          <input
            type="text"
            value={enteredByName}
            onChange={(e) => handleEnteredByChange(e.target.value)}
            placeholder="e.g. Margaret Tan or OC Desk"
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:border-emerald-500"
          />
          <span className="text-xs text-zinc-500">This name will be saved with new results</span>
        </div>
      </div>
      {participants.map((p) => {
        const data = results[p.registrationId];
        const isSaving = saving[p.registrationId];

        const isFromPaper = data.source === 'paper-transcribed';

        return (
          <div
            key={p.registrationId}
            className={`bg-white border rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start gap-4 transition-all ${
              isFromPaper 
                ? 'border-l-4 border-l-amber-500 bg-amber-50/30' 
                : 'border-l-4 border-l-transparent'
            }`}
          >
            {/* Participant Info */}
            <div className="md:w-64 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-lg">{p.name}</div>
                {isFromPaper && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-medium">
                    Paper
                  </span>
                )}
              </div>
              {p.bibNumber && (
                <div className="text-sm text-zinc-500 font-mono">Bib #{p.bibNumber}</div>
              )}

              {/* Audit info */}
              {(data.enteredBy || data.enteredAt) && (
                <div className="mt-1 text-[10px] text-zinc-400">
                  {data.enteredBy && <span>by {data.enteredBy}</span>}
                  {data.enteredAt && (
                    <span className="ml-1">
                      • {new Date(data.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Place Buttons - Big and Touch Friendly */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {PLACE_OPTIONS.map((place) => (
                  <button
                    key={place}
                    onClick={() => handleQuickPlace(p.registrationId, place)}
                    disabled={isSaving}
                    className={`flex-1 min-w-[70px] h-14 text-xl font-bold rounded-xl border-2 transition-all active:scale-95 ${
                      data.place === place
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-zinc-50 border-zinc-300 active:bg-emerald-100'
                    }`}
                  >
                    {place}
                    {place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}
                  </button>
                ))}

                {/* Status Buttons */}
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(p.registrationId, status.value)}
                    disabled={isSaving}
                    className={`px-4 h-14 text-sm font-medium rounded-xl border-2 transition-all active:scale-95 ${
                      data.status === status.value
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white hover:bg-zinc-50 border-zinc-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Performance Value */}
              {unit && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-sm text-zinc-500 w-20 shrink-0">
                    {unit === 'seconds' ? 'Time' : 'Distance'}
                  </div>
                  <Input
                    value={data.performanceValue}
                    onChange={(e) => updateResult(p.registrationId, 'performanceValue', e.target.value)}
                    onFocus={() => snapshotPrevious(p.registrationId)}
                    onBlur={() => {
                      updateWithAudit(p.registrationId, { performanceValue: data.performanceValue });
                      handleSave(p.registrationId);
                    }}
                    placeholder={unit === 'seconds' ? 'e.g. 12.45' : 'e.g. 4.82'}
                    className="max-w-[140px] text-lg h-11"
                  />
                  <span className="text-sm text-zinc-500">{unit}</span>
                </div>
              )}

              {/* Source Toggle - More prominent */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Entered via:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSourceToggle(p.registrationId, 'app')}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all active:scale-95 ${
                      data.source === 'app' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    App / Live
                  </button>
                  <button
                    onClick={() => handleSourceToggle(p.registrationId, 'paper-transcribed')}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all active:scale-95 ${
                      data.source === 'paper-transcribed' 
                        ? 'bg-amber-600 text-white border-amber-600' 
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    Paper Slip
                  </button>
                </div>
              </div>
            </div>

            {/* Save indicator + Undo */}
            <div className="md:w-24 flex flex-col items-end text-xs gap-1">
              {isSaving ? (
                <span className="text-emerald-600">Saving...</span>
              ) : data.place || data.status !== 'ok' || data.performanceValue ? (
                <span className="text-zinc-400">Saved</span>
              ) : null}

              {previousStates[p.registrationId] && !isSaving && (
                <button
                  onClick={() => handleUndo(p.registrationId)}
                  className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 text-[11px] active:scale-95"
                >
                  ↩ Undo
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!isComplete && (
        <div className="pt-4">
          <Button onClick={handleMarkComplete} variant="outline" size="lg">
            Mark Event as Complete
          </Button>
        </div>
      )}
    </div>
  );
}
