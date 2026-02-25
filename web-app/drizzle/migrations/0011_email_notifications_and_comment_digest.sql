ALTER TABLE `user` ADD `email_notifications_disabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `event_comment` ADD `notified_at` integer;
