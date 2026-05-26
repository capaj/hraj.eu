CREATE TABLE `city_event_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`city_slug` text NOT NULL,
	`city_name` text NOT NULL,
	`last_notified_event_created_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `city_event_subscription_user_city_idx` ON `city_event_subscription` (`user_id`,`city_slug`);
--> statement-breakpoint
CREATE INDEX `city_event_subscription_city_slug_idx` ON `city_event_subscription` (`city_slug`);
