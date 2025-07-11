CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`sport` text NOT NULL,
	`venue_id` text,
	`date` text NOT NULL,
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
	`status` text DEFAULT 'open' NOT NULL,
	`cancellation_reason` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`organizer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sport_date_idx` ON `event` (`sport`,`date`);--> statement-breakpoint
CREATE INDEX `organizer_idx` ON `event` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `venue_idx` ON `event` (`venue_id`);--> statement-breakpoint
CREATE TABLE `event_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`rating` integer,
	`comment` text,
	`no_show` integer DEFAULT false NOT NULL,
	`bad_behavior` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_feedback_from_to_idx` ON `event_feedback` (`event_id`,`from_user_id`,`to_user_id`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text,
	`message` text,
	`event_id` text,
	`from_user_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `notification` (`user_id`);--> statement-breakpoint
CREATE TABLE `participant` (
	`id` integer PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`confirmed_participant_ordinal` integer NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_user_idx` ON `participant` (`event_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_skill` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sport` text NOT NULL,
	`skill_level` text NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sport_idx` ON `user_skill` (`user_id`,`sport`);--> statement-breakpoint
CREATE TABLE `venue` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`country` text,
	`lat` real,
	`lng` real,
	`type` text,
	`orientation_plan` text,
	`photos` text,
	`description` text,
	`access_instructions` text,
	`opening_hours` text,
	`price_range_min` real,
	`price_range_max` real,
	`price_range_currency` text,
	`contact_phone` text,
	`contact_email` text,
	`contact_website` text,
	`rating` real,
	`total_ratings` integer,
	`created_by` text,
	`facilities` text,
	`sports` text,
	`is_verified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `city_idx` ON `venue` (`city`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`phone` text,
	`karma_points` integer DEFAULT 0 NOT NULL,
	`preferred_currency` text,
	`city` text,
	`country` text,
	`revolut_tag` text,
	`bank_account` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
