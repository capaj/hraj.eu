CREATE TABLE `venue_event_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`last_notified_event_created_at` integer,
	`created_at` integer DEFAULT unixepoch() NOT NULL,
	`updated_at` integer DEFAULT unixepoch() NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `venue_event_subscription_user_venue_idx` ON `venue_event_subscription` (`user_id`,`venue_id`);--> statement-breakpoint
CREATE INDEX `venue_event_subscription_venue_id_idx` ON `venue_event_subscription` (`venue_id`);