CREATE TABLE `event_comment_notification_delivery` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`recipient_user_id` text NOT NULL,
	`delivered_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `event_comment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_comment_notification_delivery_comment_recipient_idx` ON `event_comment_notification_delivery` (`comment_id`,`recipient_user_id`);--> statement-breakpoint
CREATE INDEX `event_comment_notification_delivery_recipient_idx` ON `event_comment_notification_delivery` (`recipient_user_id`);--> statement-breakpoint
ALTER TABLE `event_comment` ADD `notified_at` integer;--> statement-breakpoint
UPDATE `event_comment` SET `notified_at` = unixepoch();--> statement-breakpoint
CREATE INDEX `event_comment_notified_at_idx` ON `event_comment` (`notified_at`);--> statement-breakpoint
ALTER TABLE `user` ADD `email_notifications_disabled` integer DEFAULT false NOT NULL;
