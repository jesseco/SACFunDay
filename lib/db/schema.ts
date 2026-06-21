import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// OC members who can log into the admin area.
// Provisioned by an admin; password is a scrypt hash ("salt:hash" hex).
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(), // stored lowercased
  name: text("name").notNull(), // display name, used for result attribution
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("marshal"), // admin | marshal
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Age groups / Sunday school classes (reusable)
export const ageGroups = sqliteTable("age_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g. "Kindergarten", "Lower Primary (P.1-3)", "University+ (Ages 18-30)"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Events (decided by OC)
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // "Long Jump", "100m Sprint", "Egg & Spoon"
  type: text("type").notNull(), // track | field | relay | novelty
  unit: text("unit"), // seconds | meters | null (for place-only novelty)
  ageGroupId: integer("age_group_id").notNull().references(() => ageGroups.id),
  scheduledTime: text("scheduled_time"), // "09:30" or free text
  location: text("location"), // "Station A - Near the big tree"
  isComplete: integer("is_complete", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Guardians (Parents)
export const guardians = sqliteTable("guardians", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(), // primary contact
  email: text("email"),
  lunchAttendees: integer("lunch_attendees").notNull().default(0),
  paymentProof: text("payment_proof"), // URL to payment receipt/screenshot in Vercel Blob Storage
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Participants (Children + Adults)
export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  guardianId: integer("guardian_id").references(() => guardians.id), // nullable for adult participants who register themselves
  ageGroupId: integer("age_group_id").notNull().references(() => ageGroups.id),
  sundaySchoolClass: text("sunday_school_class"),
  bibNumber: text("bib_number"),
  birthYear: integer("birth_year"),
  notes: text("notes"),

  // Master QR token — one per participant. This is the single QR parents/participants will remember and show.
  // Scanning this at a station allows the In-Charge to see all registrations and check the person in for *their* event only.
  masterCheckinToken: text("master_checkin_token"), // Will be backfilled + made unique later

  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Registrations (child -> specific event)
export const registrations = sqliteTable("registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id),
  participantId: integer("participant_id").notNull().references(() => participants.id),
  source: text("source").notNull().default("manual"), // portal | manual | imported
  checkinToken: text("checkin_token").notNull().unique(), // opaque token for QR
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
  registeredAt: integer("registered_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  notes: text("notes"),
});

// Results
export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  registrationId: integer("registration_id").notNull().references(() => registrations.id),
  performanceValue: text("performance_value"), // "1:23.45" or "4.82" (store as text to preserve formatting)
  place: integer("place"),
  status: text("status").notNull().default("ok"), // ok | dns | dnf | dq | scratch
  enteredAt: integer("entered_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  enteredBy: text("entered_by"), // "OC - Jane" or "Marshal - Long Jump Station"
  source: text("source").notNull().default("app"), // app | paper-transcribed
  notes: text("notes"),
});

// Global settings for the event
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  churchName: text("church_name").notNull().default("St. Augustine's Chapel"),
  eventDate: text("event_date"), // "2026-06-14"
  eventTitle: text("event_title").notNull().default("SAC Fun Day 2026"),
  logoPath: text("logo_path"), // or store base64 if small
  portalOpen: integer("portal_open", { mode: "boolean" }).notNull().default(false),
  portalOpensAt: integer("portal_opens_at", { mode: "timestamp" }),
  portalClosesAt: integer("portal_closes_at", { mode: "timestamp" }),
  notes: text("notes"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Relations (for convenience with drizzle queries)
export const eventsRelations = relations(events, ({ one, many }) => ({
  ageGroup: one(ageGroups, {
    fields: [events.ageGroupId],
    references: [ageGroups.id],
  }),
  registrations: many(registrations),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  guardian: one(guardians, {
    fields: [participants.guardianId],
    references: [guardians.id],
  }),
  ageGroup: one(ageGroups, {
    fields: [participants.ageGroupId],
    references: [ageGroups.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  participant: one(participants, {
    fields: [registrations.participantId],
    references: [participants.id],
  }),
  result: one(results),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  registration: one(registrations, {
    fields: [results.registrationId],
    references: [registrations.id],
  }),
}));