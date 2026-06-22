'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPortalFormData } from './data';
import { submitSignup, type SignupSuccessParticipant } from './actions';

type AgeGroup = {
  id: number;
  name: string;
};

type Event = {
  id: number;
  name: string;
  type: string;
};

type AgeGroupWithEvents = AgeGroup & {
  events: Event[];
};

type Participant = {
  id: number;
  type: 'adult' | 'child';
  name: string;
  ageGroupId?: number;
  selectedEvents: number[]; // max 4
};

export default function ParentSignup() {
  const [ageGroups, setAgeGroups] = useState<AgeGroupWithEvents[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const [lunchCount, setLunchCount] = useState(0);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, type: 'child', name: '', selectedEvents: [] },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SignupSuccessParticipant[] | null>(null);

  // Youth groups for filtering the age dropdown (children see these, adults see the rest).
  // Update this list if the age groups are changed for the year.
  const youthAgeGroupNames = [
    "Kindergarten",
    "G1-3",
    "G4-6",
    "S1-S6",
  ];

  // Load real data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPortalFormData();
        // Combine age groups with their events
        const grouped = data.ageGroups.map((ag: any) => ({
          ...ag,
          events: data.eventsByAgeGroup[ag.id] || [],
        }));
        setAgeGroups(grouped);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const addParticipant = (type: 'adult' | 'child') => {
    setParticipants([
      ...participants,
      { id: Date.now(), type, name: '', selectedEvents: [] },
    ]);
  };

  const removeParticipant = (id: number) => {
    if (participants.length === 1) return;
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id: number, field: keyof Participant, value: any) => {
    setParticipants(
      participants.map(p => {
        if (p.id !== id) return p;
        
        const updated = { ...p, [field]: value };

        // If changing age group, reset selected events
        if (field === 'ageGroupId') {
          updated.selectedEvents = [];
        }

        // Enforce max 4 events
        if (field === 'selectedEvents' && Array.isArray(value) && value.length > 4) {
          updated.selectedEvents = value.slice(0, 4);
        }

        return updated;
      })
    );
  };

  const toggleEvent = (participantId: number, eventId: number) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const current = participant.selectedEvents || [];
    let newSelected: number[];

    if (current.includes(eventId)) {
      newSelected = current.filter(id => id !== eventId);
    } else {
      if (current.length >= 4) {
        alert("You can select a maximum of 4 events per person.");
        return;
      }
      newSelected = [...current, eventId];
    }

    updateParticipant(participantId, 'selectedEvents', newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('guardianName', guardianName);
    formData.set('guardianPhone', guardianPhone);
    formData.set('guardianEmail', guardianEmail || '');
    formData.set('lunchCount', lunchCount.toString());

    if (paymentFile) {
      formData.set('paymentProof', paymentFile);
    }

    // Serialize participants (simple JSON for now)
    formData.set('participants', JSON.stringify(participants));

    try {
      const result = await submitSignup(formData);
      setSuccessData(result.participants);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              You're all signed up!
            </h1>
            <p className="text-zinc-600">
              Here are your <strong>Master QR codes</strong>. Save or screenshot them now — 
              you'll need to show the right one at each station.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {successData.map((person, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="font-semibold text-xl mb-1">{person.name}</p>
                
                {person.events.length > 0 && (
                  <p className="text-sm text-zinc-600 mb-4">
                    Registered for: {person.events.join(' • ')}
                  </p>
                )}

                <div className="flex justify-center mb-4">
                  <img 
                    src={person.qrDataUrl} 
                    alt={`Master QR code for ${person.name}`}
                    className="w-56 h-56 border border-zinc-200 rounded-xl p-2 bg-white"
                  />
                </div>

                <a
                  href={person.qrDataUrl}
                  download={`QR_${person.name.replace(/\s+/g, '_')}.png`}
                  className="inline-block text-sm text-emerald-700 hover:underline font-medium"
                >
                  Download this QR code
                </a>

                <p className="text-xs text-zinc-500 mt-3">
                  This is your single Master QR. Show this at every station you are registered for.
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                // Reset everything so they can register another person/group
                setSuccessData(null);
                setGuardianName('');
                setGuardianPhone('');
                setGuardianEmail('');
                setLunchCount(0);
                setPaymentFile(null);
                setParticipants([{ id: Date.now(), type: 'child', name: '', selectedEvents: [] }]);
              }}
              className="flex-1 h-12 rounded-full border flex items-center justify-center hover:bg-white font-medium"
            >
              Register another person / group
            </button>
            <Link
              href="/portal/retrieve"
              className="flex-1 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
            >
              Retrieve QR later
            </Link>
          </div>

          <p className="text-center text-xs text-zinc-500 mt-6">
            You can always come back to the portal and use "Retrieve Your QR Code" if you lose these.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-12 text-center">Loading sign-up form...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/portal" className="text-sm text-emerald-700 hover:underline">
          ← Back to portal
        </Link>

        <h1 className="text-4xl font-semibold tracking-tight mt-6 mb-2">
          Sign up for SAC Fun Day
        </h1>
        <p className="text-zinc-600 mb-2">
          You can sign up yourself (as an adult) and/or your children.
        </p>
        <p className="text-sm text-orange-600 mb-8">
          Maximum 4 events per participant. A $20 sign-up / lunch fee applies.
        </p>
        <p className="text-xs text-zinc-500 mb-4">
          Note: Events and age groups may have been updated for this year — please select carefully.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Guardian / Contact Person */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Your Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full border rounded-lg px-4 h-11"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full border rounded-lg px-4 h-11"
                  placeholder="+852 9123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 h-11"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {/* Lunch, Fee & Payment */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-lg mb-2">Lunch & Payment</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                How many people (including yourself and any children you are registering) will be joining lunch?
              </label>
              <input
                type="number"
                min={0}
                value={lunchCount}
                onChange={(e) => setLunchCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-32 border rounded-lg px-4 h-11"
              />
              <p className="text-xs text-zinc-500 mt-1">This helps us plan catering.</p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
                A <strong>$20 sign-up / lunch fee</strong> applies (per person registered or attending lunch).
                Please make payment and upload proof below.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">Proof of Payment *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
                {paymentFile && (
                  <p className="text-xs text-emerald-600 mt-1">Selected: {paymentFile.name}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">Upload a screenshot or photo of your payment receipt.</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Who are you signing up?</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addParticipant('adult')}
                  className="text-sm px-3 py-1 border rounded-full hover:bg-white"
                >
                  + Add Adult
                </button>
                <button
                  type="button"
                  onClick={() => addParticipant('child')}
                  className="text-sm px-3 py-1 border rounded-full hover:bg-white"
                >
                  + Add Child
                </button>
              </div>
            </div>

            {participants.map((participant, index) => {
              const isChild = participant.type === 'child';

              // Get the participant's age group
              const participantAgeGroup = participant.ageGroupId
                ? ageGroups.find(ag => ag.id === participant.ageGroupId)
                : null;

              // Get events for this participant's age group
              let availableEvents = participant.ageGroupId
                ? ageGroups.find(ag => ag.id === participant.ageGroupId)?.events || []
                : [];

              // Add family relay events based on eligibility
              if (participantAgeGroup) {
                const isAdult = participantAgeGroup.name === 'Women' ||
                                participantAgeGroup.name === 'Men 49 or below' ||
                                participantAgeGroup.name === 'Men 50+';

                // Kindergarten Family Relay: Kindergarten children OR any adult
                const kindergartenRelayEvent = ageGroups
                  .flatMap(ag => ag.events)
                  .find((e: any) => e.name === 'Kindergarten Family Relay');

                if (kindergartenRelayEvent &&
                    (participantAgeGroup.name === 'Kindergarten' || isAdult)) {
                  if (!availableEvents.some((e: any) => e.id === kindergartenRelayEvent.id)) {
                    availableEvents = [...availableEvents, kindergartenRelayEvent];
                  }
                }

                // Primary & Secondary Family Relay: G1-3, G4-6, S1-S6 children OR any adult
                const primaryRelayEvent = ageGroups
                  .flatMap(ag => ag.events)
                  .find((e: any) => e.name === 'Primary & Secondary Family Relay');

                if (primaryRelayEvent &&
                    (participantAgeGroup.name === 'G1-3' ||
                     participantAgeGroup.name === 'G4-6' ||
                     participantAgeGroup.name === 'S1-S6' ||
                     isAdult)) {
                  if (!availableEvents.some((e: any) => e.id === primaryRelayEvent.id)) {
                    availableEvents = [...availableEvents, primaryRelayEvent];
                  }
                }
              }

              return (
                <div key={participant.id} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium flex items-center gap-2">
                      {isChild ? 'Child' : 'Adult'} {index + 1}
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-100">
                        {isChild ? 'Child' : 'Adult'}
                      </span>
                    </div>
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={participant.name}
                        onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                        className="w-full border rounded-lg px-4 h-11"
                      />
                    </div>

                    {/* Age Group selector - shown for both children and adults */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Age Group / Category *</label>
                      <select
                        required
                        value={participant.ageGroupId || ''}
                        onChange={(e) => updateParticipant(participant.id, 'ageGroupId', parseInt(e.target.value))}
                        className="w-full border rounded-lg px-4 h-11"
                      >
                        <option value="">Select age group / category</option>
                        {ageGroups
                          .filter(ag =>
                            isChild
                              ? youthAgeGroupNames.includes(ag.name)
                              : !youthAgeGroupNames.includes(ag.name)
                          )
                          .map(ag => (
                            <option key={ag.id} value={ag.id}>{ag.name}</option>
                          ))}
                      </select>
                      {!isChild && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Adults: Select your category — Women, Men 49 or below, or Men 50+
                        </p>
                      )}
                    </div>

                    {/* Events Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Events (max 4)
                        {participant.selectedEvents.length > 0 && (
                          <span className="ml-2 text-emerald-600">({participant.selectedEvents.length}/4)</span>
                        )}
                      </label>

                      {isChild && !participant.ageGroupId && (
                        <div className="text-xs text-zinc-500">Please select an age group first to see available events.</div>
                      )}

                      {/* Event selection - shown once an age group / category is selected */}
                      {participant.ageGroupId && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableEvents.length > 0 ? (
                            availableEvents.map((event: any) => {
                              const isSelected = participant.selectedEvents.includes(event.id);

                              return (
                                <label
                                  key={event.id}
                                  className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-zinc-50'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEvent(participant.id, event.id)}
                                    disabled={!isSelected && participant.selectedEvents.length >= 4}
                                  />
                                  <span>{event.name}</span>
                                </label>
                              );
                            })
                          ) : (
                            <div className="text-xs text-zinc-500 col-span-2">
                              No events available for this category yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-emerald-600 text-white text-lg font-medium disabled:opacity-60 hover:bg-emerald-700"
          >
            {isSubmitting ? 'Submitting Registration...' : 'Complete Sign-up'}
          </button>

          <p className="text-center text-xs text-zinc-500">
            You'll see your Master QR codes immediately after submitting.
          </p>
        </form>
      </div>
    </div>
  );
}
