CREATE TABLE `age_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `age_groups_name_unique` ON `age_groups` (`name`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`unit` text,
	`age_group_id` integer NOT NULL,
	`scheduled_time` text,
	`location` text,
	`is_complete` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`age_group_id`) REFERENCES `age_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`guardian_id` integer NOT NULL,
	`age_group_id` integer NOT NULL,
	`sunday_school_class` text,
	`bib_number` text,
	`birth_year` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`age_group_id`) REFERENCES `age_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`participant_id` integer NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`checkin_token` text NOT NULL,
	`checked_in_at` integer,
	`registered_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_checkin_token_unique` ON `registrations` (`checkin_token`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_id` integer NOT NULL,
	`performance_value` text,
	`place` integer,
	`status` text DEFAULT 'ok' NOT NULL,
	`entered_at` integer NOT NULL,
	`entered_by` text,
	`source` text DEFAULT 'app' NOT NULL,
	`notes` text,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_name` text DEFAULT 'St. Augustine''s Chapel' NOT NULL,
	`event_date` text,
	`event_title` text DEFAULT 'SAC Fun Day 2026' NOT NULL,
	`logo_path` text,
	`portal_open` integer DEFAULT false NOT NULL,
	`portal_opens_at` integer,
	`portal_closes_at` integer,
	`updated_at` integer NOT NULL
);
