CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'marshal' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`guardian_id` integer,
	`age_group_id` integer NOT NULL,
	`sunday_school_class` text,
	`bib_number` text,
	`birth_year` integer,
	`notes` text,
	`master_checkin_token` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`age_group_id`) REFERENCES `age_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_participants`("id", "name", "guardian_id", "age_group_id", "sunday_school_class", "bib_number", "birth_year", "notes", "master_checkin_token", "created_at") SELECT "id", "name", "guardian_id", "age_group_id", "sunday_school_class", "bib_number", "birth_year", "notes", "master_checkin_token", "created_at" FROM `participants`;--> statement-breakpoint
DROP TABLE `participants`;--> statement-breakpoint
ALTER TABLE `__new_participants` RENAME TO `participants`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `settings` ADD `notes` text;