CREATE TABLE `recurring_event` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`sport` text NOT NULL,
	`venue_id` text,
	`start_time` text NOT NULL,
	`duration` integer NOT NULL,
	`min_participants` integer NOT NULL,
	`ideal_participants` integer,
	`max_participants` integer NOT NULL,
	`cancellation_deadline_minutes` integer NOT NULL,
	`price` real,
	`payment_details` text,
	`game_rules` text,
	`is_public` integer DEFAULT true NOT NULL,
	`organizer_id` text NOT NULL,
	`required_skill_level` text,
	`interval_days` integer,
	`interval_weeks` integer,
	`start_date` text NOT NULL,
	`end_date` text,
	`last_generated_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT unixepoch() NOT NULL,
	`updated_at` integer DEFAULT unixepoch() NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`organizer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recurring_organizer_idx` ON `recurring_event` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `recurring_active_idx` ON `recurring_event` (`is_active`);--> statement-breakpoint
DROP INDEX "event_feedback_from_to_idx";--> statement-breakpoint
DROP INDEX "sport_date_idx";--> statement-breakpoint
DROP INDEX "organizer_idx";--> statement-breakpoint
DROP INDEX "venue_idx";--> statement-breakpoint
DROP INDEX "recurring_idx";--> statement-breakpoint
DROP INDEX "user_idx";--> statement-breakpoint
DROP INDEX "event_user_idx";--> statement-breakpoint
DROP INDEX "recurring_organizer_idx";--> statement-breakpoint
DROP INDEX "recurring_active_idx";--> statement-breakpoint
DROP INDEX "user_sport_idx";--> statement-breakpoint
DROP INDEX "city_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `event` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
CREATE UNIQUE INDEX `event_feedback_from_to_idx` ON `event_feedback` (`event_id`,`from_user_id`,`to_user_id`);--> statement-breakpoint
CREATE INDEX `sport_date_idx` ON `event` (`sport`,`date`);--> statement-breakpoint
CREATE INDEX `organizer_idx` ON `event` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `venue_idx` ON `event` (`venue_id`);--> statement-breakpoint
CREATE INDEX `recurring_idx` ON `event` (`recurring_event_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notification` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_user_idx` ON `participant` (`event_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sport_idx` ON `user_skill` (`user_id`,`sport`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `venue` (`city`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `event` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `event` ADD `recurring_event_id` text REFERENCES recurring_event(id);--> statement-breakpoint
ALTER TABLE `event_feedback` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `notification` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `participant` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `user_skill` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `user_skill` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `venue` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT unixepoch();--> statement-breakpoint
ALTER TABLE `venue` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT unixepoch();