import { db } from "../lib/db/client";
import {
  ageGroups,
  events,
  guardians,
  participants,
  registrations,
  results,
  settings,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// Simple helper for generating short check-in tokens
function generateToken() {
  return randomUUID().slice(0, 8);
}

async function main() {
  console.log("🌱 Seeding SACFunDay database...");

  // Structural reset for major age group reorganization
  // This gives us a clean slate with the exact new bands the church uses
  console.log("   Resetting demo data (age groups, events, participants, registrations, results)...");
  await db.delete(results).run();
  await db.delete(registrations).run();
  await db.delete(participants).run();
  await db.delete(events).run();
  await db.delete(ageGroups).run();
  // Keep guardians and global settings (they are stable)

  // 1. Age Groups - exact list requested
  const ageGroupData = [
    { name: "Kindergarten", sortOrder: 1 },
    { name: "Lower Primary (P.1-3)", sortOrder: 2 },
    { name: "Upper Primary (P.4-6)", sortOrder: 3 },
    { name: "Lower Secondary (S.1-3)", sortOrder: 4 },
    { name: "Upper Secondary (S.4-6)", sortOrder: 5 },
    { name: "University+ (Ages 18-30)", sortOrder: 6 },
    { name: "Ages 30-45", sortOrder: 7 },
    { name: "Ages 45-60", sortOrder: 8 },
    { name: "Ages 60+", sortOrder: 9 },
  ];

  const insertedAgeGroups = [];
  for (const ag of ageGroupData) {
    let existing = await db
      .select()
      .from(ageGroups)
      .where(eq(ageGroups.name, ag.name))
      .get();

    if (!existing) {
      existing = await db
        .insert(ageGroups)
        .values(ag)
        .returning()
        .get();
    }
    insertedAgeGroups.push(existing);
  }
  console.log(`✓ ${insertedAgeGroups.length} age groups ready`);

  const ageGroupMap = Object.fromEntries(
    insertedAgeGroups.map((ag) => [ag.name, ag.id])
  );

  // 2. Guardians (parents) - reduced for lighter demo (~20 total participants)
  // Using clearly fictional names and phones for public repository safety
  const guardianData = [
    { name: "Alex Rivera", phone: "+65 9000 0001", email: "alex.rivera@example.com" },
    { name: "Jordan Kim", phone: "+65 9000 0002", email: "jordan.kim@example.com" },
    { name: "Taylor Brooks", phone: "+65 9000 0003", email: "taylor.brooks@example.com" },
    { name: "Morgan Ellis", phone: "+65 9000 0004", email: undefined },
    { name: "Casey Quinn", phone: "+65 9000 0005", email: "casey.quinn@example.com" },
    { name: "Riley Santos", phone: "+65 9000 0006", email: "riley.santos@example.com" },
    { name: "Jamie Patel", phone: "+65 9000 0007", email: undefined },
    { name: "Avery Chen", phone: "+65 9000 0008", email: "avery.chen@example.com" },
    { name: "Reese Morgan", phone: "+65 9000 0009", email: "reese.morgan@example.com" },
    { name: "Skyler Hayes", phone: "+65 9000 0010", email: undefined },
  ];

  const insertedGuardians = [];
  for (const g of guardianData) {
    let existing = await db
      .select()
      .from(guardians)
      .where(eq(guardians.phone, g.phone))
      .get();

    if (!existing) {
      existing = await db
        .insert(guardians)
        .values(g)
        .returning()
        .get();
    }
    insertedGuardians.push(existing);
  }
  console.log(`✓ ${insertedGuardians.length} guardians ready`);

  // 3. Events (mapped to the new 9 age groups)
  const eventData = [
    // Kindergarten (gentle, fun, short attention span)
    { name: "Egg & Spoon Race", type: "novelty", unit: null, ageGroup: "Kindergarten" },
    { name: "Bean Bag Toss", type: "novelty", unit: null, ageGroup: "Kindergarten" },
    { name: "Teddy Bear Relay", type: "relay", unit: null, ageGroup: "Kindergarten" },
    { name: "Musical Hoops", type: "novelty", unit: null, ageGroup: "Kindergarten" },
    { name: "Sack Race (Short)", type: "novelty", unit: null, ageGroup: "Kindergarten" },

    // Lower Primary (P.1-3)
    { name: "50m Dash", type: "track", unit: "seconds", ageGroup: "Lower Primary (P.1-3)" },
    { name: "Standing Long Jump", type: "field", unit: "meters", ageGroup: "Lower Primary (P.1-3)" },
    { name: "Sack Race", type: "novelty", unit: null, ageGroup: "Lower Primary (P.1-3)" },
    { name: "Hula Hoop Contest", type: "novelty", unit: null, ageGroup: "Lower Primary (P.1-3)" },
    { name: "Water Relay", type: "relay", unit: null, ageGroup: "Lower Primary (P.1-3)" },

    // Upper Primary (P.4-6)
    { name: "100m Sprint", type: "track", unit: "seconds", ageGroup: "Upper Primary (P.4-6)" },
    { name: "Long Jump", type: "field", unit: "meters", ageGroup: "Upper Primary (P.4-6)" },
    { name: "4x50m Relay", type: "relay", unit: "seconds", ageGroup: "Upper Primary (P.4-6)" },
    { name: "Obstacle Course", type: "novelty", unit: null, ageGroup: "Upper Primary (P.4-6)" },
    { name: "High Jump (Low)", type: "field", unit: "meters", ageGroup: "Upper Primary (P.4-6)" },

    // Lower Secondary (S.1-3)
    { name: "200m Sprint", type: "track", unit: "seconds", ageGroup: "Lower Secondary (S.1-3)" },
    { name: "Long Jump (Running)", type: "field", unit: "meters", ageGroup: "Lower Secondary (S.1-3)" },
    { name: "4x100m Relay (Junior)", type: "relay", unit: "seconds", ageGroup: "Lower Secondary (S.1-3)" },
    { name: "Discus (Light)", type: "field", unit: "meters", ageGroup: "Lower Secondary (S.1-3)" },
    { name: "Tug of War (Team)", type: "novelty", unit: null, ageGroup: "Lower Secondary (S.1-3)" },

    // Upper Secondary (S.4-6) - more serious / athletic
    { name: "400m Run", type: "track", unit: "seconds", ageGroup: "Upper Secondary (S.4-6)" },
    { name: "Shot Put", type: "field", unit: "meters", ageGroup: "Upper Secondary (S.4-6)" },
    { name: "High Jump", type: "field", unit: "meters", ageGroup: "Upper Secondary (S.4-6)" },
    { name: "4x400m Relay (Senior)", type: "relay", unit: "seconds", ageGroup: "Upper Secondary (S.4-6)" },
    { name: "Javelin (Soft Tip)", type: "field", unit: "meters", ageGroup: "Upper Secondary (S.4-6)" },

    // University+ (Ages 18-30) - energetic young adults
    { name: "100m Sprint (University)", type: "track", unit: "seconds", ageGroup: "University+ (Ages 18-30)" },
    { name: "200m Sprint (University)", type: "track", unit: "seconds", ageGroup: "University+ (Ages 18-30)" },
    { name: "Long Jump (University)", type: "field", unit: "meters", ageGroup: "University+ (Ages 18-30)" },
    { name: "3-Legged Race (University)", type: "novelty", unit: null, ageGroup: "University+ (Ages 18-30)" },
    { name: "Volleyball (University)", type: "novelty", unit: null, ageGroup: "University+ (Ages 18-30)" },
    { name: "Frisbee Golf (University)", type: "novelty", unit: null, ageGroup: "University+ (Ages 18-30)" },

    // Ages 30-45
    { name: "100m Dash (30-45)", type: "track", unit: "seconds", ageGroup: "Ages 30-45" },
    { name: "Bocce Ball (30-45)", type: "novelty", unit: null, ageGroup: "Ages 30-45" },
    { name: "Table Tennis (30-45)", type: "novelty", unit: null, ageGroup: "Ages 30-45" },
    { name: "3-Legged Race (30-45)", type: "novelty", unit: null, ageGroup: "Ages 30-45" },
    { name: "Power Walk + Jog (30-45)", type: "track", unit: "seconds", ageGroup: "Ages 30-45" },

    // Ages 45-60
    { name: "50m Power Walk (45-60)", type: "track", unit: "seconds", ageGroup: "Ages 45-60" },
    { name: "Bocce / Petanque (45-60)", type: "novelty", unit: null, ageGroup: "Ages 45-60" },
    { name: "Table Tennis (45-60)", type: "novelty", unit: null, ageGroup: "Ages 45-60" },
    { name: "Ring Toss Challenge (45-60)", type: "novelty", unit: null, ageGroup: "Ages 45-60" },
    { name: "Water Relay (Mixed 45-60)", type: "relay", unit: null, ageGroup: "Ages 45-60" },

    // Ages 60+ (inclusive, fun, low physical demand, high joy)
    { name: "Slow Power Walk (60+)", type: "track", unit: "seconds", ageGroup: "Ages 60+" },
    { name: "Seated Egg & Spoon (60+)", type: "novelty", unit: null, ageGroup: "Ages 60+" },
    { name: "Bocce / Lawn Bowls (60+)", type: "novelty", unit: null, ageGroup: "Ages 60+" },
    { name: "Balloon Pass Relay (60+)", type: "novelty", unit: null, ageGroup: "Ages 60+" },
    { name: "Chair Balance & Reach (60+)", type: "novelty", unit: null, ageGroup: "Ages 60+" },
    { name: "Memory & Coordination (60+)", type: "novelty", unit: null, ageGroup: "Ages 60+" },
  ];

  const insertedEvents = [];
  for (const ev of eventData) {
    const ageGroupId = ageGroupMap[ev.ageGroup];
    if (!ageGroupId) continue;

    let existing = await db
      .select()
      .from(events)
      .where(eq(events.name, ev.name))
      .get();

    if (!existing) {
      existing = await db
        .insert(events)
        .values({
          name: ev.name,
          type: ev.type,
          unit: ev.unit,
          ageGroupId,
          scheduledTime: ["09:00", "09:30", "10:00", "10:30", "11:00"][Math.floor(Math.random() * 5)],
          location: ["Station A", "Station B", "Near the field", "Main track"][Math.floor(Math.random() * 4)],
        })
        .returning()
        .get();
    }
    insertedEvents.push(existing);
  }
  console.log(`✓ ${insertedEvents.length} events ready`);

  // 4. Participants + Registrations (target 60-80+ kids + adults)
  const firstNames = ["Ethan", "Olivia", "Liam", "Emma", "Noah", "Ava", "Lucas", "Sophia", "Mason", "Isabella", "Jacob", "Mia", "William", "Charlotte", "James", "Amelia", "Benjamin", "Harper", "Elijah", "Evelyn", "Lucas", "Aria", "Henry", "Luna"];
  // Using fictional last names for public repository
  const lastNames = ["Rivera", "Kim", "Brooks", "Ellis", "Quinn", "Santos", "Patel", "Chen", "Morgan", "Hayes", "Lane", "Reed", "Blake", "Vale", "Ross", "Hayes", "Stone", "Wells"];

  let kidCount = 0;

  // Create more guardians for realism (demo data - using fictional names only)
  const extraGuardians = [
    { name: "Harper Lane", phone: "+65 9000 0011" },
    { name: "Finley Reed", phone: "+65 9000 0012" },
    { name: "Phoenix Vale", phone: "+65 9000 0013" },
    { name: "Rowan Blake", phone: "+65 9000 0014" },
  ];

  for (const g of extraGuardians) {
    const exists = await db.select().from(guardians).where(eq(guardians.phone, g.phone)).get();
    if (!exists) {
      const newG = await db.insert(guardians).values(g).returning().get();
      insertedGuardians.push(newG);
    }
  }

  // Create ~15 children total (light demo)
  const targetKids = 15;
  let kidsCreated = 0;

  for (let i = 0; i < insertedGuardians.length && kidsCreated < targetKids; i++) {
    const guardian = insertedGuardians[i];
    const numKids = (kidsCreated < targetKids - 2) ? 2 : 1; // mostly 2 kids per family

    for (let k = 0; k < numKids && kidsCreated < targetKids; k++) {
      const youthAgeGroupNames = [
        "Kindergarten",
        "Lower Primary (P.1-3)",
        "Upper Primary (P.4-6)",
        "Lower Secondary (S.1-3)",
        "Upper Secondary (S.4-6)",
      ];
      const chosenAgeGroup = youthAgeGroupNames[Math.floor(Math.random() * youthAgeGroupNames.length)];
      const ageGroupId = ageGroupMap[chosenAgeGroup];

      const kidName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

      const participant = await db
        .insert(participants)
        .values({
          name: kidName,
          guardianId: guardian.id,
          ageGroupId,
          sundaySchoolClass: chosenAgeGroup.includes("Primary") || chosenAgeGroup.includes("Secondary") ? chosenAgeGroup : undefined,
          bibNumber: `SAC${String(100 + kidsCreated).padStart(3, "0")}`,
          masterCheckinToken: randomUUID(),
        })
        .returning()
        .get();

      const possibleEvents = insertedEvents.filter((e) => e.ageGroupId === ageGroupId);
      const numRegistrations = Math.min(possibleEvents.length, 2 + Math.floor(Math.random() * 2));

      const shuffled = [...possibleEvents].sort(() => 0.5 - Math.random());
      const selectedEvents = shuffled.slice(0, numRegistrations);

      for (const ev of selectedEvents) {
        await db
          .insert(registrations)
          .values({
            eventId: ev.id,
            participantId: participant.id,
            source: Math.random() > 0.7 ? "portal" : "manual",
            checkinToken: generateToken(),
          })
          .onConflictDoNothing()
          .run();
      }

      kidsCreated++;
    }
  }

  kidCount = kidsCreated;
  console.log(`✓ ${kidCount} children + registrations created`);

  // Create 5 regular self-registered adult participants (no guardian)
  // Using clearly fictional names for public repository safety
  const regularAdultNames = ["Ethan Vale", "Olivia Reed", "Lucas Blake", "Emma Lane", "Noah Quinn"];
  let regularAdultCount = 0;

  const adultAgeGroups = ["University+ (Ages 18-30)", "Ages 30-45", "Ages 45-60"];
  for (let i = 0; i < 5; i++) {
    const adultName = regularAdultNames[i];
    const chosenGroup = adultAgeGroups[i % adultAgeGroups.length];
    const ageGroupId = ageGroupMap[chosenGroup];
    if (!ageGroupId) continue;

    const adult = await db
      .insert(participants)
      .values({
        name: adultName,
        guardianId: null, // self-registered adult
        ageGroupId,
        birthYear: 1985 + (i % 15),
        masterCheckinToken: randomUUID(),
      })
      .returning()
      .get();

    // Register to 2 events
    const adultEvents = insertedEvents.filter(e => e.ageGroupId === ageGroupId);
    const shuffled = [...adultEvents].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);

    for (const ev of selected) {
      await db.insert(registrations).values({
        eventId: ev.id,
        participantId: adult.id,
        source: 'portal',
        checkinToken: generateToken(),
      }).onConflictDoNothing().run();
    }
    regularAdultCount++;
  }
  console.log(`✓ ${regularAdultCount} regular self-adult participants + registrations created`);

  // 5. Generate sample results (for demo purposes - makes the app feel alive)
  console.log("Generating sample results for demo...");
  let resultsCreated = 0;

  // Generic demo attributions for sample results. Real results are attributed
  // to the logged-in OC member; this is only to populate the demo audit trail.
  const ocNames = ["Demo Entry"];

  // Pick 4 events to mark as complete with results (lighter demo)
  const eventsToComplete = insertedEvents
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  for (const event of eventsToComplete) {
    // Get all registrations for this event
    const eventRegistrations = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, event.id));

    if (eventRegistrations.length === 0) continue;

    // Mark event complete
    await db
      .update(events)
      .set({ isComplete: true })
      .where(eq(events.id, event.id));

    // Generate results with some variety
    const shuffledRegs = [...eventRegistrations].sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffledRegs.length; i++) {
      const reg = shuffledRegs[i];
      let place: number | null = null;
      let status = "ok";
      let performance: string | null = null;

      const rand = Math.random();

      if (i < 3 && rand > 0.15) {
        // Top 3 get places
        place = i + 1;
      } else if (rand < 0.08) {
        status = "dnf";
      } else if (rand < 0.12) {
        status = "dns";
      } else if (rand < 0.15) {
        status = "scratch";
      }

      // Generate plausible performance values based on event type
      if (event.unit === "seconds") {
        const base = event.type === "relay" ? 52 : 22;
        performance = (base + Math.random() * 12).toFixed(2);
      } else if (event.unit === "meters") {
        const base = event.type === "field" ? 3.2 : 2.4;
        performance = (base + Math.random() * 1.8).toFixed(2);
      }

      const enteredBy = ocNames[Math.floor(Math.random() * ocNames.length)];

      await db.insert(results).values({
        registrationId: reg.id,
        performanceValue: performance,
        place,
        status,
        enteredBy,
        source: "app",
      });

      resultsCreated++;
    }
  }

  console.log(`✓ ${resultsCreated} sample results generated across ${eventsToComplete.length} completed events`);

  // 6. Basic settings
  await db
    .insert(settings)
    .values({
      churchName: "St. Augustine's Chapel",
      eventDate: "2026-06-14",
      eventTitle: "SAC Fun Day 2026",
      portalOpen: false,
    })
    .onConflictDoNothing()
    .run();

  console.log("✅ SACFunDay seed complete!");
  console.log(`   - ${insertedAgeGroups.length} age groups`);
  console.log(`   - ${insertedEvents.length} events`);
  console.log(`   - ${insertedGuardians.length} guardians`);
  console.log(`   - ${kidCount} children + ${regularAdultCount} regular adults (using fictional demo data)`);
  console.log(`   - ${resultsCreated} sample results across ${eventsToComplete.length} completed events (entered by OC)`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});